const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_admin_key_123';

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Single shared DB pool
// ─────────────────────────────────────────────────────────────
const prisma = require('./db');

// ─────────────────────────────────────────────────────────────
// Static files — serve each dashboard folder
// ─────────────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'Admin')));
app.use('/vet', express.static(path.join(__dirname, 'vet-dashboard')));
app.use('/refuge', express.static(path.join(__dirname, 'Refuge-Dashboard')));
app.use('/SignIn', express.static(path.join(__dirname, 'SignIn')));
app.use('/User-Dashbord', express.static(path.join(__dirname, 'User-Dashbord')));

// Serve photo & diploma folders
app.use('/photo', express.static(path.join(__dirname, 'photo')));
app.use('/diplomat', express.static(path.join(__dirname, 'diplomat')));
app.use('/refugePhoto', express.static(path.join(__dirname, 'refugePhoto')));

// Root → Admin dashboard
app.get('/', (req, res) => res.redirect('/Admin/index.html'));
app.get('/login', (req, res) => res.redirect('/SignIn/SignInPage.html'));

// ═════════════════════════════════════════════════════════════
// SIGN-IN & APP ROUTER (Normal Users)
// ═════════════════════════════════════════════════════════════
app.use('/app/users', require('./User-Dashbord/api/router'));
app.use('/app', require('./SignIn/api/comenRouter'));

// ═════════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═════════════════════════════════════════════════════════════
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Require Admin Role' });
        req.user = decoded;
        next();
    });
};

// ═════════════════════════════════════════════════════════════
// ADMIN BACKEND v2.5 (UNIFIED)
// ═════════════════════════════════════════════════════════════
const adminRouter = express.Router();

// 1. PUBLIC ENTRANCE (LOGIN)
adminRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.users.findFirst({ where: { email, role: 'admin' } });
        if (!user) return res.status(401).json({ error: 'Admin account not found' });
        
        const isMatch = (password === user.pass_word) || 
                       (await bcrypt.compare(password, user.pass_word).catch(() => false));
        
        if (!isMatch) return res.status(401).json({ error: 'Password incorrect' });

        const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { name: user.first_name, role: user.role } });
    } catch (e) { 
        res.status(500).json({ error: 'Login failed' }); 
    }
});

// 2. SECURITY GATE
adminRouter.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Identity required' });
    const token = auth.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') return res.status(403).json({ error: 'Access forbidden' });
        req.admin = decoded;
        next();
    });
});

// 3. DASHBOARD STATS & ACTIVITY
adminRouter.get('/stats', async (req, res) => {
    try {
        const [normal, vets, refuges, activeDemands] = await Promise.all([
            prisma.users.count({ where: { role: 'normal' } }),
            prisma.users.count({ where: { role: 'vet' } }),
            prisma.users.count({ where: { role: 'refuge' } }),
            prisma.demands.count()
        ]);
        res.json({
            users: { total: normal, trend: '+12%' },
            vets: { total: vets, trend: '+3%' },
            refuges: { total: refuges, trend: '+5%' },
            reports: { total: activeDemands, trend: 'Live' }
        });
    } catch (e) { res.status(500).json({ error: 'Stats failed' }); }
});

adminRouter.get('/activity', async (req, res) => {
    try {
        const demands = await prisma.demands.findMany({
            take: 5, orderBy: { created_at: 'desc' },
            include: { users: { select: { first_name: true, last_name: true } } }
        });
        res.json(demands.map(d => ({
            name: `${d.users?.first_name || 'System'} ${d.users?.last_name || ''}`,
            action: `Reported a ${d.animal_type}`,
            date: d.created_at,
            status: 'Active'
        })));
    } catch (e) { res.status(500).json({ error: 'Activity failed' }); }
});

// 4. ACCOUNT MANAGEMENT
adminRouter.get('/accounts', async (req, res) => {
    try {
        const { role } = req.query;
        let where = { role: { not: 'admin' } };
        if (role && role !== 'all') where.role = role;

        const list = await prisma.users.findMany({ 
            where, 
            orderBy: { created_at: 'desc' },
            select: { id: true, first_name: true, last_name: true, email: true, role: true, account_status: true, created_at: true }
        });
        res.json(list);
    } catch (e) { res.status(500).json({ error: 'Accounts failed' }); }
});

adminRouter.put('/accounts/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await prisma.users.update({ where: { id: parseInt(req.params.id) }, data: { account_status: status } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

adminRouter.delete('/accounts/:id', async (req, res) => {
    try {
        await prisma.users.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Deletion failed' }); }
});

// 5. REPORTS MANAGEMENT
adminRouter.get('/reports', async (req, res) => {
    try {
        const reports = await prisma.demands.findMany({ 
            include: { users: { select: { first_name: true, last_name: true, email: true } } },
            orderBy: { created_at: 'desc' } 
        });
        res.json(reports.map(r => ({
            id: r.id,
            animal_type: r.animal_type,
            reporter: `${r.users?.first_name || 'Anon'} ${r.users?.last_name || ''}`,
            email: r.users?.email,
            date: r.created_at,
            status: 'Pending'
        })));
    } catch (e) { res.status(500).json({ error: 'Reports failed' }); }
});

// 6. PROFILE & SECURITY
adminRouter.get('/profile', async (req, res) => {
    try {
        const u = await prisma.users.findUnique({ where: { id: req.admin.id } });
        res.json(u);
    } catch (e) { res.status(500).json({ error: 'Profile failed' }); }
});

adminRouter.put('/profile', async (req, res) => {
    try {
        const { first_name, last_name, email } = req.body;
        const u = await prisma.users.update({
            where: { id: req.admin.id },
            data: { first_name, last_name, email }
        });
        res.json(u);
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

adminRouter.put('/profile/password', async (req, res) => {
    try {
        const { current, newPass } = req.body;
        const user = await prisma.users.findUnique({ where: { id: req.admin.id } });
        
        const isMatch = (current === user.pass_word) || 
                       (await bcrypt.compare(current, user.pass_word).catch(() => false));
        
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

        const hashed = await bcrypt.hash(newPass, 10);
        await prisma.users.update({ where: { id: req.admin.id }, data: { pass_word: hashed } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Password update failed' }); }
});

app.use('/api/admin', adminRouter);


// ═════════════════════════════════════════════════════════════
// VET ROUTER  —  /api/vet
// ═════════════════════════════════════════════════════════════
const vetRouter = express.Router();
vetRouter.use(authenticateUser); // SECURE ENTIRE ROUTER

// GET /api/vet/demands
vetRouter.get('/demands', async (req, res) => {
    try {
        const vetId = req.user.id;
        let targetPostalCode = null;
        if (vetId) {
            const vetRows = await prisma.users.findUnique({ where: { id: vetId } });
            if (vetRows && vetRows.postal_code) targetPostalCode = vetRows.postal_code;
        }
        let where = {
            vet_rejections: { none: { vet_id: vetId } },
            OR: [
                { demands_assignments: { none: {} }, examination_reports: { none: {} } },
                { demands_assignments: { some: { accepted_by: vetId } } }
            ]
        };
        if (targetPostalCode) {
            where.users = { postal_code: targetPostalCode };
        }
        const demandsRaw = await prisma.demands.findMany({
            where,
            include: { 
                users: { select: { first_name: true, last_name: true, postal_code: true } },
                demands_assignments: { select: { accepted_by: true } },
                examination_reports: { select: { id: true } }
            }
        });
        const rows = demandsRaw.map(d => {
            let dynStatus = 'pending';
            if (d.examination_reports.length > 0) {
                dynStatus = 'completed';
            } else if (d.demands_assignments.some(a => a.accepted_by === vetId)) {
                dynStatus = 'accepted';
            } else if (d.demands_assignments.length > 0) {
                // If assigned to someone else and no report yet
                dynStatus = 'accepted_by_other';
            }

            return {
                demand_id: d.id,
                petType: d.animal_type,
                animal_status: d.animal_status,
                event_date: d.event_date,
                created_at: d.created_at,
                status: dynStatus,
                photo: d.photo,
                symptoms: d.additional_details,
                ownerFirstName: d.users?.first_name,
                ownerLastName: d.users?.last_name,
                address: d.location
            };
        });
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch demands' });
    }
});

// GET /api/vet/demands/pending
vetRouter.get('/demands/pending', async (req, res) => {
    try {
        const vetId = req.user.id;
        let targetPostalCode = null;
        if (vetId) {
            const vetRows = await prisma.users.findUnique({ where: { id: vetId } });
            if (vetRows && vetRows.postal_code) targetPostalCode = vetRows.postal_code;
        }
        let where = { 
            demands_assignments: { none: {} },
            examination_reports: { none: {} },
            vet_rejections: { none: { vet_id: vetId } }
        };
        if (targetPostalCode) {
            where.users = { postal_code: targetPostalCode };
        }
        const demandsRaw = await prisma.demands.findMany({
            where,
            include: { users: { select: { first_name: true, last_name: true } } }
        });
        const rows = demandsRaw.map(d => ({
            demand_id: d.id,
            petType: d.animal_type,
            animal_status: d.animal_status,
            event_date: d.event_date,
            status: 'pending',
            photo: d.photo,
            symptoms: d.additional_details,
            ownerFirstName: d.users?.first_name,
            ownerLastName: d.users?.last_name,
            address: d.location
        }));
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pending demands' });
    }
});

// PUT /api/vet/demands/:id/accept
vetRouter.put('/demands/:id/accept', async (req, res) => {
    const demandId = req.params.id;
    const vet_id = req.user.id;
    if (!vet_id) return res.status(400).json({ error: 'vet_id is required' });
    try {
        // Record which vet accepted this demand
        await prisma.demands_assignments.create({
            data: {
                demand_id: parseInt(demandId, 10),
                accepted_by: vet_id
            }
        });

        res.json({ success: true, message: 'Demand accepted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to accept demand' });
    }
});

// PUT /api/vet/demands/:id/reject
vetRouter.put('/demands/:id/reject', async (req, res) => {
    const demandId = req.params.id;
    const vet_id = req.user.id;
    if (!vet_id) return res.status(400).json({ error: 'vet_id is required' });
    try {
        try {
            await prisma.vet_rejections.create({ data: { vet_id: parseInt(vet_id, 10), demand_id: parseInt(demandId, 10) } });
        } catch(e) { }
        res.json({ success: true, message: 'Demand rejected locally' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reject demand' });
    }
});

// POST /api/vet/examination-reports
vetRouter.post('/examination-reports', async (req, res) => {
    const { demand_id, diagnosis, treatment, notes, shelter_placement } = req.body;
    const vet_id = req.user.id;
    if (!demand_id || !vet_id || !diagnosis || !treatment)
        return res.status(400).json({ error: 'Missing required fields' });
    try {
        await prisma.examination_reports.create({
            data: { demand_id: parseInt(demand_id, 10), vet_id: parseInt(vet_id, 10), diagnosis, treatment, notes, shelter_placement: shelter_placement || 'no' }
        });
        res.json({ success: true, message: 'Report saved and demand completed' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save examination report' });
    }
});

// GET /api/vet/vets/:id/history
vetRouter.get('/vets/:id/history', async (req, res) => {
    try {
        const rowsRaw = await prisma.examination_reports.findMany({
            where: { vet_id: req.user.id },
            orderBy: { created_at: 'desc' },
            include: { demands: { include: { users: { select: { first_name: true, last_name: true } } } } }
        });
        const rows = rowsRaw.map(r => ({
            report_id: r.id,
            demand_id: r.demand_id,
            date: r.created_at,
            diagnosis: r.diagnosis,
            treatment: r.treatment,
            notes: r.notes,
            petType: r.demands?.animal_type,
            ownerFirstName: r.demands?.users?.first_name,
            ownerLastName: r.demands?.users?.last_name
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// GET /api/vet/vets/:id
vetRouter.get('/vets/:id', async (req, res) => {
    try {
        const vetRow = await prisma.vets.findUnique({
            where: { user_id: req.user.id },
            include: { users: { select: { first_name: true, last_name: true } } }
        });
        if (!vetRow) return res.status(404).json({ error: 'Vet not found' });
        res.json({
            first_name: vetRow.users.first_name,
            last_name: vetRow.users.last_name,
            diplomat: vetRow.diplomat,
            adress_vet: vetRow.adress_vet,
            license_number: vetRow.license_number
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /api/vet/users/:id/password
vetRouter.put('/users/:id/password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword are required' });
    try {
        const userRec = await prisma.users.findUnique({ where: { id: req.user.id } });
        if (!userRec) return res.status(404).json({ error: 'User not found' });

        const currentPass = userRec.pass_word;
        const isMatch = await bcrypt.compare(oldPassword, currentPass).catch(() => false) || oldPassword === currentPass;
        if (!isMatch) return res.status(401).json({ error: 'Incorrect old password' });

        await prisma.users.update({ where: { id: req.user.id }, data: { pass_word: newPassword } });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// PUT /api/vet/vets/:id/address
vetRouter.put('/vets/:id/address', async (req, res) => {
    const { adress_vet } = req.body;
    if (!adress_vet) return res.status(400).json({ error: 'Address is required' });
    try {
        await prisma.vets.update({ where: { user_id: req.user.id }, data: { adress_vet } });
        res.json({ success: true, message: 'Address updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update address' });
    }
});

app.use('/api/vet', vetRouter);

// ═════════════════════════════════════════════════════════════
// REFUGE ROUTER  —  /api/refuge
// ═════════════════════════════════════════════════════════════
const refugeRouter = express.Router();

// POST /api/refuge/auth/login
refugeRouter.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.users.findFirst({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.pass_word).catch(() => false) || password === user.pass_word;
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        
        res.json({
            message: 'Logged in successfully',
            role: user.role,
            user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/refuge/auth/register
refugeRouter.post('/auth/register', async (req, res) => {
    const { email, password, first_name, last_name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await prisma.users.create({
            data: { email, pass_word: hashedPassword, first_name, last_name, role }
        });
        res.status(201).json({ message: 'User created successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/refuge/demands
refugeRouter.get('/demands', authenticateUser, async (req, res) => {
    try {
        const refugeId = req.user.id;
        let targetPostalCode = null;
        if (refugeId) {
            const rowRaw = await prisma.users.findUnique({ where: { id: refugeId } });
            if (rowRaw) targetPostalCode = rowRaw.postal_code;
        }
        let where = {};
        if (targetPostalCode) {
            where.users = { postal_code: targetPostalCode };
        }
        const demandsRaw = await prisma.demands.findMany({
            where: {
                demands_assignments: {
                    some: { accepted_by: req.user.id }
                }
            },
            orderBy: { created_at: 'desc' },
            include: { users: { select: { first_name: true, last_name: true, email: true } } }
        });
        const demands = demandsRaw.map(d => ({
            ...d,
            first_name: d.users?.first_name,
            last_name: d.users?.last_name,
            email: d.users?.email,
            status: 'accepted',
            users: undefined
        }));
        res.json(demands);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/refuge/demands/:id/status
refugeRouter.put('/demands/:id/status', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (status === 'rejected') {
            await prisma.refuge_rejections.upsert({
                where: { refuge_id_demand_id: { refuge_id: req.user.id, demand_id: parseInt(id, 10) } },
                update: {},
                create: { refuge_id: req.user.id, demand_id: parseInt(id, 10) }
            });
            return res.json({ message: 'Demand rejected locally' });
        }

        const check = await prisma.demands_assignments.findFirst({
            where: { demand_id: parseInt(id, 10), accepted_by: req.user.id }
        });
        if (!check) {
            await prisma.demands_assignments.create({
                data: { demand_id: parseInt(id, 10), accepted_by: req.user.id }
            });
        }

        res.json({ message: 'Demand status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/refuge/demands/:id
refugeRouter.delete('/demands/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.demands.delete({ where: { id: parseInt(id, 10) } });
        res.json({ message: 'Demand successfully deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/refuge/shelter-requests
// Returns demands where a vet examination report recommends shelter placement
// AND the demand has not yet been accepted by a refuge
refugeRouter.get('/shelter-requests', authenticateUser, async (req, res) => {
    try {
        const rowsRaw = await prisma.examination_reports.findMany({
            where: {
                shelter_placement: 'yes',
                demands: { 
                    demands_assignments: { none: { users: { role: 'refuge' } } },
                    refuge_rejections: { none: { refuge_id: req.user.id } }
                }
            },
            orderBy: { created_at: 'desc' },
            include: {
                demands: { include: { users: { select: { first_name: true, last_name: true, email: true } } } },
                vets: { include: { users: { select: { first_name: true, last_name: true } } } }
            }
        });
        const rows = rowsRaw.map(e => ({
            id: e.demands?.id,
            animal_type: e.demands?.animal_type,
            animal_status: e.demands?.animal_status,
            location: e.demands?.location,
            event_date: e.demands?.event_date,
            created_at: e.demands?.created_at,
            status: 'completed',
            photo: e.demands?.photo,
            additional_details: e.demands?.additional_details,
            first_name: e.demands?.users?.first_name,
            last_name: e.demands?.users?.last_name,
            email: e.demands?.users?.email,
            report_id: e.id,
            diagnosis: e.diagnosis,
            treatment: e.treatment,
            notes: e.notes,
            shelter_placement: e.shelter_placement,
            report_date: e.created_at,
            vet_name: e.vets?.users ? `${e.vets.users.first_name} ${e.vets.users.last_name}` : null
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/refuge/demands-assignments
refugeRouter.post('/demands-assignments', authenticateUser, async (req, res) => {
    const { demand_id } = req.body;
    const accepted_by = req.user.id;
    if (!demand_id || !accepted_by)
        return res.status(400).json({ error: 'demand_id and accepted_by are required' });
    try {
        const result = await prisma.demands_assignments.create({
            data: { demand_id: parseInt(demand_id, 10), accepted_by }
        });
        res.status(201).json({ message: 'Demand accepted successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/refuge/demands-assignments
refugeRouter.get('/demands-assignments', authenticateUser, async (req, res) => {
    try {
        const assignments = await prisma.demands_assignments.findMany({
            where: { accepted_by: req.user.id },
            include: { demands: { select: { id: true, animal_type: true, created_at: true } } }
        });
        const rejections = await prisma.refuge_rejections.findMany({
            where: { refuge_id: req.user.id },
            include: { demands: { select: { id: true, animal_type: true, created_at: true } } }
        });

        const combined = [
            ...assignments.map(a => ({
                demand_id: a.demand_id,
                animal_type: a.demands?.animal_type,
                demand_status: 'accepted',
                demand_date: a.demands?.created_at
            })),
            ...rejections.map(r => ({
                demand_id: r.demand_id,
                animal_type: r.demands?.animal_type,
                demand_status: 'rejected',
                demand_date: r.demands?.created_at
            }))
        ].sort((a, b) => (b.demand_id || 0) - (a.demand_id || 0));

        res.json(combined);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/refuge/vets/reports
refugeRouter.post('/vets/reports', authenticateUser, async (req, res) => {
    const { demand_id, diagnosis, treatment, notes, shelter_placement } = req.body;
    const vet_id = req.user.id;
    try {
        const result = await prisma.examination_reports.create({
            data: { demand_id: parseInt(demand_id, 10), vet_id, diagnosis, treatment, notes, shelter_placement: shelter_placement || 'no' }
        });
        res.status(201).json({ message: 'Report created successfully', id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/refuge/vets/reports
refugeRouter.get('/vets/reports', authenticateUser, async (req, res) => {
    try {
        const reportsRaw = await prisma.examination_reports.findMany({
            where: {
                demands: {
                    OR: [
                        { demands_assignments: { none: { users: { role: 'refuge' } } } },
                        { demands_assignments: { some: { accepted_by: req.user.id } } },
                        { refuge_rejections: { some: { refuge_id: req.user.id } } }
                    ]
                }
            },
            orderBy: { created_at: 'desc' },
            include: {
                demands: { select: { animal_type: true } },
                vets: { include: { users: { select: { first_name: true, last_name: true } } } }
            }
        });
        const reports = reportsRaw.map(e => ({
            ...e,
            animal_type: e.demands?.animal_type,
            vet_first_name: e.vets?.users?.first_name,
            vet_last_name: e.vets?.users?.last_name,
            status: (e.demands?.demands_assignments?.length > 0) ? 'accepted' : 'completed',
            demands: undefined,
            vets: undefined
        }));
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/refuge/refuges/settings
refugeRouter.get('/refuges/settings', authenticateUser, async (req, res) => {
    const user_id = req.user.id;
    try {
        const rowRaw = await prisma.users.findUnique({
            where: { id: user_id },
            include: { refuges: true }
        });
        if (!rowRaw || !rowRaw.refuges) return res.status(404).json({ message: 'Refuge not found' });
        
        const openTime = rowRaw.refuges.opening_from;
        const closeTime = rowRaw.refuges.opening_till;
        
        res.json({
            email: rowRaw.email,
            first_name: rowRaw.first_name,
            last_name: rowRaw.last_name,
            address: rowRaw.refuges.adress_refuge,
            capacity: rowRaw.refuges.capacity,
            current_animals: rowRaw.refuges.current_animals,
            opening_from: openTime ? openTime.toISOString().substring(11, 16) : null,
            opening_till: closeTime ? closeTime.toISOString().substring(11, 16) : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/refuge/refuges/settings
refugeRouter.put('/refuges/settings', authenticateUser, async (req, res) => {
    const { name, email, add, maxcap, cap, open, close, password, oldPassword } = req.body;
    const user_id = req.user.id;
    try {
        if (password) {
            if (!oldPassword) return res.status(400).json({ error: 'Old password is required' });
            const userRec = await prisma.users.findUnique({ where: { id: user_id } });
            if (!userRec) return res.status(404).json({ error: 'User not found' });

            const currentPass = userRec.pass_word;
            const isMatch = await bcrypt.compare(oldPassword, currentPass).catch(() => false) || oldPassword === currentPass;
            if (!isMatch) return res.status(401).json({ error: 'Incorrect old password' });
        }

        const newHashed = password ? await bcrypt.hash(password, 10) : undefined;
        let userData = { email, first_name: name, last_name: '' };
        if (newHashed) userData.pass_word = newHashed;

        await prisma.users.update({ where: { id: user_id }, data: userData });

        await prisma.refuges.update({
            where: { user_id },
            data: {
                adress_refuge: add,
                capacity: maxcap ? parseInt(maxcap, 10) : null,
                current_animals: cap ? parseInt(cap, 10) : null,
                opening_from: open ? new Date(`1970-01-01T${open}Z`) : null,
                opening_till: close ? new Date(`1970-01-01T${close}Z`) : null
            }
        });
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/refuge', refugeRouter);

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Unified server running on http://localhost:${PORT}`);
    console.log(`   Admin  →  http://localhost:${PORT}/admin/`);
    console.log(`   Vet    →  http://localhost:${PORT}/vet/home.html`);
    console.log(`   Refuge →  http://localhost:${PORT}/refuge/Home.html`);
    console.log(`   User   →  http://localhost:${PORT}/User-Dashbord/index.html`);
    console.log(`   SignIn →  http://localhost:${PORT}/SignIn/SignInPage.html`);
});
