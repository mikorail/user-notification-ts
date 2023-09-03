INSERT INTO public."User" (first_name,last_name,email,continent,city,birthday,gen_status) VALUES
	 ('ALI','','ALI@gmail.com','Indonesia','Depok','1993-10-02 00:00:00',false),
	 ('ADI','','ADI@gmail.com','Indonesia','Depok','1993-09-02 00:00:00',true),
	 ('ANI','','ANI@gmail.com','Indonesia','Depok','1993-09-02 00:00:00',true),
	 ('Anwar','','Anwar@gmall.com','Indonesia','Depok','1993-09-02 00:00:00',true),
	 ('Danial','','Danial@gmall.com','Australia','Sydney','2002-09-03 00:00:00',false),
	 ('Maman','','Maman@gmall.com','America','Los_Angeles','2002-09-02 00:00:00',false),
	 ('Randy','','Randy@gmall.com','Indonesia','Semarang','1993-09-02 00:00:00',false),
	 ('Mocel','','Mocel@gmall.com','Asia','Jakarta','1993-09-03 00:00:00',false);

INSERT INTO public."Message" (userid,email,message,status,sent_at,birthday,continent,city,created_at) VALUES
	 (13,'ADI@gmail.com','Happy Birthday to ADI ',false,NULL,'1993-09-02 00:00:00','Indonesia','Depok','2023-09-02 08:13:11.246'),
	 (15,'ANI@gmail.com','Happy Birthday to ANI ',false,NULL,'1993-09-02 00:00:00','Indonesia','Depok','2023-09-02 08:13:38.612'),
	 (16,'Anwar@gmall.com','Happy Birthday to Anwar ',false,NULL,'1993-09-02 00:00:00','Indonesia','Depok','2023-09-02 08:23:15.197');
