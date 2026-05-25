const express = require('express');
const router = express.Router();
const {
  reportAnimal,
  logMyDemands,
  logLatestDemands,
  delDemandeById,
  modifyDemandById,
  getProfile,
  updateProfile,
  updatePassword,
  countDemands,
  countApprovedDemands,
  countPendingDemands,
  countCompletedDemands,
  authenticate,
  uploadPhoto
} = require('./utiles');

router.post('/addDemand', authenticate, uploadPhoto, async (req, res) => {
  let { animal_type, animal_status, location, event_date, event_time, additional_details } = req.body;
  if (!animal_status) animal_status = null;
  if (!event_date) event_date = null;
  if (!event_time) event_time = null;

  try {
    await reportAnimal(
      animal_type,
      location,
      event_date,
      event_time,
      req.file ? req.file.filename : null,
      req.userId,
      additional_details,
      animal_status
    );
    res.status(201).json({ message: "Demand added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/getDemands', authenticate, async (req, res) => {
  try {
    const data = await logMyDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/getLatestDemands', authenticate, async (req, res) => {
  try {
    const data = await logLatestDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delDemand/:id', authenticate, async (req, res) => {
  try {
    await delDemandeById(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/modifyDemand/:id', authenticate, async (req, res) => {
  try {
    if (req.body.event_date === "") req.body.event_date = null;
    if (req.body.event_time === "") req.body.event_time = null;

    await modifyDemandById(req.params.id, req.body);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const data = await getProfile(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    await updateProfile(req.userId, req.body);
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/changePassword', authenticate, async (req, res) => {
  const { newPassword } = req.body;
  try {
    await updatePassword(req.userId, newPassword);
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countDemands', authenticate, async (req, res) => {
  try {
    const data = await countDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countApproved', authenticate, async (req, res) => {
  try {
    const data = await countApprovedDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countPending', authenticate, async (req, res) => {
  try {
    const data = await countPendingDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/countCompleted', authenticate, async (req, res) => {
  try {
    const data = await countCompletedDemands(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;