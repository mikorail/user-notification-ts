-- public."Message" definition

-- Drop table

-- DROP TABLE public."Message";

CREATE TABLE public."Message" (
	id serial4 NOT NULL,
	userid int4 NOT NULL,
	email text NULL,
	message text NOT NULL,
	status bool NULL,
	sent_at timestamp(3) NULL,
	birthday timestamp(3) NULL,
	continent text NOT NULL,
	city text NOT NULL,
	created_at timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "Message_pkey" PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "Message_email_key" ON public."Message" USING btree (email);
CREATE UNIQUE INDEX "Message_userid_key" ON public."Message" USING btree (userid);

-- public."User" definition

-- Drop table

-- DROP TABLE public."User";

CREATE TABLE public."User" (
	id serial4 NOT NULL,
	first_name text NOT NULL,
	last_name text NULL,
	email text NULL,
	continent text NOT NULL,
	city text NOT NULL,
	birthday timestamp(3) NULL,
	gen_status bool NOT NULL,
	CONSTRAINT "User_pkey" PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);