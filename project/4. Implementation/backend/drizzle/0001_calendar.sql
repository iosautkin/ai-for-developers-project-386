CREATE TABLE `owners` (
  `id` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meeting_types` (
  `sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id` text NOT NULL,
  `owner_id` text NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `duration_minutes` integer NOT NULL,
  `created_at_ms` integer NOT NULL,
  CONSTRAINT `meeting_types_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `meeting_types_duration_valid` CHECK (`duration_minutes` >= 15 AND `duration_minutes` <= 540 AND `duration_minutes` % 15 = 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_types_public_id_unique` ON `meeting_types` (`id`);
--> statement-breakpoint
CREATE TABLE `bookings` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `meeting_type_id` text NOT NULL,
  `guest_name` text NOT NULL,
  `guest_email` text NOT NULL,
  `guest_note` text,
  `starts_at_ms` integer NOT NULL,
  `ends_at_ms` integer NOT NULL,
  `created_at_ms` integer NOT NULL,
  CONSTRAINT `bookings_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `bookings_meeting_type_fk` FOREIGN KEY (`meeting_type_id`) REFERENCES `meeting_types`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `bookings_interval_valid` CHECK (`ends_at_ms` > `starts_at_ms`)
);
--> statement-breakpoint
CREATE INDEX `bookings_interval_idx` ON `bookings` (`starts_at_ms`, `ends_at_ms`);
--> statement-breakpoint
INSERT INTO `owners` (`id`, `display_name`) VALUES ('owner-1', 'Иван');
--> statement-breakpoint
INSERT INTO `meeting_types` (`id`, `owner_id`, `title`, `description`, `duration_minutes`, `created_at_ms`)
VALUES ('consultation', 'owner-1', 'Консультация', 'Обсудим ваш вопрос и определим следующие шаги.', 30, 0);
