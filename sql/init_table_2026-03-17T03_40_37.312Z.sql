CREATE TABLE IF NOT EXISTS `books` (
	`book_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`accession_no_start` INTEGER NOT NULL,
	`accession_no_end` INTEGER NOT NULL,
	`isbn ` INTEGER NOT NULL UNIQUE,
	`title` VARCHAR(255) NOT NULL,
	`author` VARCHAR(255) NOT NULL,
	`illustrator` VARCHAR(255) NOT NULL,
	`publisher` VARCHAR(255) NOT NULL,
	`publication_year` YEAR NOT NULL,
	`category_id` INTEGER NOT NULL,
	`total_copies` INTEGER NOT NULL,
	`available_copies` INTEGER NOT NULL,
	`shelf_location` VARCHAR(255) NOT NULL,
	`created_at` DATE NOT NULL,
	`last_updated_at` DATE NOT NULL,
	`key_stage_grade_level` ENUM('KS 1 - Kinder to Grade 3', 'KS 1 & 2 - Kinder to Grade 6', 'KS 2 - Grade 4 to 6', 'KS 4 - Grade 11 to 12', 'KS 3 & 4 - Grade 7 to 12', 'KS 3 - Grade 7 to 10', 'Kinder to Grade 1', 'KS 2 & 3 - Grade 4 to 10', 'KS 1 - Kinder at Grade 3') NOT NULL,
	`no_of_pages` INTEGER NOT NULL,
	PRIMARY KEY(`book_id`)
);


CREATE TABLE IF NOT EXISTS `users` (
	`user_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_no` INTEGER NOT NULL UNIQUE,
	`first_name` VARCHAR(255) NOT NULL,
	`middle_name` VARCHAR(255),
	`last_name` VARCHAR(255) NOT NULL,
	`suffix` VARCHAR(255),
	`email` VARCHAR(255) NOT NULL UNIQUE,
	`phone` INTEGER NOT NULL UNIQUE,
	`address` VARCHAR(255),
	`user_level` ENUM('admin', 'staff') NOT NULL,
	`status` ENUM('active', 'closed') NOT NULL,
	`created_at` DATE NOT NULL,
	`username` VARCHAR(255) NOT NULL UNIQUE,
	`password_hash` VARCHAR(255) NOT NULL,
	PRIMARY KEY(`user_id`)
);


CREATE TABLE IF NOT EXISTS `circulations` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`book_id` INTEGER NOT NULL UNIQUE,
	`student_lrn` INTEGER,
	`student_name` VARCHAR(255),
	`student_school` INTEGER NOT NULL UNIQUE,
	`librarian_id` INTEGER NOT NULL UNIQUE,
	`borrow_date` DATE,
	`due_date` DATE,
	`return_date` DATE,
	`status` ENUM('borrowed', 'returned', 'overdue', 'lost') NOT NULL,
	`renewal_count` INTEGER DEFAULT 0,
	`no_of_copies` INTEGER,
	`remarks` TEXT(65535),
	`created_at` DATE,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `categories` (
	`category_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` ENUM('Fiction Book') NOT NULL,
	PRIMARY KEY(`category_id`)
);


CREATE TABLE IF NOT EXISTS `schools` (
	`school_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` ENUM('placeholder'),
	PRIMARY KEY(`school_id`)
);


CREATE TABLE IF NOT EXISTS `logs` (
	`log_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`log_time` DATETIME,
	`action_name` VARCHAR(255),
	`description` VARCHAR(255),
	PRIMARY KEY(`log_id`)
);


ALTER TABLE `books`
ADD FOREIGN KEY(`category_id`) REFERENCES `categories`(`category_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `circulations`
ADD FOREIGN KEY(`book_id`) REFERENCES `books`(`book_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `circulations`
ADD FOREIGN KEY(`librarian_id`) REFERENCES `users`(`user_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `circulations`
ADD FOREIGN KEY(`student_school`) REFERENCES `schools`(`school_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;