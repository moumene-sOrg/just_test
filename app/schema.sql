-- =============================================================
-- UNIFIED SCHEMA — esi_projects database
-- All 3 dashboards: Admin (port 3000), Vet (port 3001), Refuge (port 3002)
-- Run this ONCE on a fresh database to set everything up.
-- =============================================================

CREATE DATABASE IF NOT EXISTS `esi_projects`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `esi_projects`;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS `examination_reports`;
DROP TABLE IF EXISTS `demands_assignments`;
DROP TABLE IF EXISTS `demands`;
DROP TABLE IF EXISTS `refuges`;
DROP TABLE IF EXISTS `vets`;
DROP TABLE IF EXISTS `normal_users`;
DROP TABLE IF EXISTS `users`;

-- ─────────────────────────────────────────────────────────────
-- 1. users
--    Core identity table shared by all dashboards.
--    Extra columns: account_status (Admin), last_login_at (Admin),
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `email`          VARCHAR(50)   NOT NULL,
  `pass_word`      VARCHAR(255)  NOT NULL,
  `first_name`     VARCHAR(100)  DEFAULT NULL,
  `last_name`      VARCHAR(100)  DEFAULT NULL,
  `role`           ENUM('normal','vet','refuge','admin') NOT NULL,
  `account_status` ENUM('active','pending','disabled') NOT NULL DEFAULT 'active',
  `last_login_at`  TIMESTAMP     NULL DEFAULT NULL,
  `postal_code`    VARCHAR(20)   DEFAULT NULL,
  `created_at`     TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 2. normal_users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `normal_users` (
  `user_id` INT NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `normal_users_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 3. vets
--    Extra columns: speciality, license_number (Vet backend profile)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `vets` (
  `user_id`        INT          NOT NULL,
  `diplomat`       VARCHAR(255) DEFAULT NULL,
  `adress_vet`     VARCHAR(255) DEFAULT NULL,
  `license_number` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `vets_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 4. refuges
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `refuges` (
  `user_id`              INT          NOT NULL,
  `adress_refuge`        VARCHAR(255) DEFAULT NULL,
  `capacity`             INT          DEFAULT NULL,
  `registration`         INT          DEFAULT NULL,
  `facility_photo`       VARCHAR(255) DEFAULT NULL,
  `opening_from`         TIME         DEFAULT NULL,
  `opening_till`         TIME         DEFAULT NULL,
  `current_animals`      INT          DEFAULT NULL,
  `representative_name`  VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `refuges_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 5. demands
--    status includes 'rejected' for Admin dashboard.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `demands` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `animal_type`        ENUM('dog','cat','bird','cow','sheep','other') NOT NULL,
  `animal_status`      VARCHAR(255) DEFAULT NULL,
  `location`           VARCHAR(255) DEFAULT NULL,
  `event_date`         DATE         DEFAULT NULL,
  `event_time`         TIME         DEFAULT NULL,
  `photo`              VARCHAR(255) DEFAULT NULL,
  `status`             ENUM('pending','accepted','completed','rejected') DEFAULT 'pending',
  `created_by`         INT          DEFAULT NULL,
  `created_at`         TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  `additional_details` TEXT,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `demands_ibfk_1`
    FOREIGN KEY (`created_by`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 6. demands_assignments
--    Tracks which user (refuge/vet) accepted which demand.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `demands_assignments` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `demand_id`   INT DEFAULT NULL,
  `accepted_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demand_id` (`demand_id`),
  KEY `accepted_by` (`accepted_by`),
  CONSTRAINT `demands_assignments_ibfk_1`
    FOREIGN KEY (`demand_id`)  REFERENCES `demands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `demands_assignments_ibfk_2`
    FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`)   ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────────────────────
-- 7. examination_reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE `examination_reports` (
  `id`                INT  NOT NULL AUTO_INCREMENT,
  `demand_id`         INT  NOT NULL,
  `vet_id`            INT  NOT NULL,
  `diagnosis`         TEXT NOT NULL,
  `treatment`         TEXT NOT NULL,
  `notes`             TEXT,
  `shelter_placement` ENUM('yes','no') DEFAULT 'no',
  `created_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_id` (`demand_id`),
  KEY `vet_id`    (`vet_id`),
  CONSTRAINT `exam_reports_ibfk_1`
    FOREIGN KEY (`demand_id`) REFERENCES `demands` (`id`)       ON DELETE CASCADE,
  CONSTRAINT `exam_reports_ibfk_2`
    FOREIGN KEY (`vet_id`)    REFERENCES `vets`    (`user_id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- 8. vet_rejections
--    Tracks which demands a specific vet has dismissed from their view.
-- =============================================================
CREATE TABLE `vet_rejections` (
  `vet_id` INT NOT NULL,
  `demand_id` INT NOT NULL,
  PRIMARY KEY (`vet_id`, `demand_id`),
  CONSTRAINT `vet_rejections_ibfk_1`
    FOREIGN KEY (`vet_id`) REFERENCES `vets` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `vet_rejections_ibfk_2`
    FOREIGN KEY (`demand_id`) REFERENCES `demands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- Done. All 8 tables created.
-- =============================================================
SELECT 'schema.sql applied successfully — 8 tables ready.' AS status;
