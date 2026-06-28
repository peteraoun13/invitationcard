CREATE TABLE IF NOT EXISTS dashboard_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS families (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  family_name VARCHAR(190) NOT NULL,
  invite_token VARCHAR(80) NOT NULL UNIQUE,
  public_slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  opened_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_families_status (status),
  INDEX idx_families_invite_token (invite_token),
  INDEX idx_families_public_slug (public_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  family_id INT UNSIGNED NOT NULL,
  family_name VARCHAR(190) NOT NULL,
  guest_name VARCHAR(190) NOT NULL,
  guest_count INT UNSIGNED NOT NULL DEFAULT 1,
  token VARCHAR(80) NOT NULL,
  attending TINYINT(1) NULL,
  responded TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guests_family_id (family_id),
  INDEX idx_guests_token (token),
  CONSTRAINT fk_guests_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rsvps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guest_id INT UNSIGNED NULL,
  attending TINYINT(1) NOT NULL,
  number_attending INT UNSIGNED NOT NULL DEFAULT 0,
  message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rsvps_guest_id (guest_id),
  CONSTRAINT fk_rsvps_guest
    FOREIGN KEY (guest_id) REFERENCES guests(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS uploads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  family_id INT UNSIGNED NULL,
  guest_id INT UNSIGNED NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_uploads_family_id (family_id),
  INDEX idx_uploads_guest_id (guest_id),
  CONSTRAINT fk_uploads_family
    FOREIGN KEY (family_id) REFERENCES families(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_uploads_guest
    FOREIGN KEY (guest_id) REFERENCES guests(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create your first admin password hash locally with:
-- php -r "echo password_hash('CHANGE_ME_STRONG_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
-- Then replace the hash below and run the INSERT.
--
-- INSERT INTO dashboard_users (email, password_hash, role)
-- VALUES ('admin@example.com', '$2y$10$REPLACE_WITH_PASSWORD_HASH', 'admin');
