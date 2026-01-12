CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`type` enum('image','audio','video') NOT NULL,
	`url` text NOT NULL,
	`localPath` text,
	`duration` int,
	`transcription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`userId` int NOT NULL,
	`permission` enum('view','edit','admin') DEFAULT 'view',
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collaborators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`parentFolderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` enum('note','todo') DEFAULT 'note',
	`tags` json DEFAULT ('[]'),
	`folderId` int,
	`isArchived` boolean DEFAULT false,
	`isPinned` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSyncedAt` timestamp,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`entityType` enum('note','task','attachment','collaborator') NOT NULL,
	`entityId` int NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','synced','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`syncedAt` timestamp,
	CONSTRAINT `syncQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noteId` int NOT NULL,
	`title` text NOT NULL,
	`completed` boolean DEFAULT false,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`dueDate` timestamp,
	`parentTaskId` int,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_noteId_notes_id_fk` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collaborators` ADD CONSTRAINT `collaborators_noteId_notes_id_fk` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collaborators` ADD CONSTRAINT `collaborators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_parentFolderId_folders_id_fk` FOREIGN KEY (`parentFolderId`) REFERENCES `folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_folderId_folders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `syncQueue` ADD CONSTRAINT `syncQueue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_noteId_notes_id_fk` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parentTaskId_tasks_id_fk` FOREIGN KEY (`parentTaskId`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attachments_noteId_idx` ON `attachments` (`noteId`);--> statement-breakpoint
CREATE INDEX `collaborators_noteId_idx` ON `collaborators` (`noteId`);--> statement-breakpoint
CREATE INDEX `collaborators_userId_idx` ON `collaborators` (`userId`);--> statement-breakpoint
CREATE INDEX `folders_userId_idx` ON `folders` (`userId`);--> statement-breakpoint
CREATE INDEX `folders_parentFolderId_idx` ON `folders` (`parentFolderId`);--> statement-breakpoint
CREATE INDEX `notes_userId_idx` ON `notes` (`userId`);--> statement-breakpoint
CREATE INDEX `notes_folderId_idx` ON `notes` (`folderId`);--> statement-breakpoint
CREATE INDEX `syncQueue_userId_idx` ON `syncQueue` (`userId`);--> statement-breakpoint
CREATE INDEX `syncQueue_status_idx` ON `syncQueue` (`status`);--> statement-breakpoint
CREATE INDEX `tags_userId_idx` ON `tags` (`userId`);--> statement-breakpoint
CREATE INDEX `tasks_noteId_idx` ON `tasks` (`noteId`);--> statement-breakpoint
CREATE INDEX `tasks_parentTaskId_idx` ON `tasks` (`parentTaskId`);