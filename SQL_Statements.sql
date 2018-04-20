/* Login */
--verify valid credentials
SELECT * 
FROM User 
WHERE Username = $username AND Password = $password;

/* New visitor registration */
--verify registration is valid
SELECT * 
FROM User 
WHERE Username = $username OR Email = $email;
--insert new visitor account
INSERT INTO User 
VALUES ($username, $email, $password, 'VISITOR');

/* New owner registration */
--check that owner does not exist
SELECT *
FROM User
WHERE Username = $username AND Email = $email;
--populate animal dropdown
SELECT *
FROM FarmItem
WHERE Type = 'ANIMAL';
--populate crop dropdown
SELECT *
FROM FarmItem
WHERE Type != 'ANIMAL';
--add new owner
INSERT INTO User 
VALUES ($username, $email, $password, 'OWNER');
--add new property
SELECT MAX(ID) FROM Property --find largest property id
INSERT INTO Property 
VALUES ($propertyid, $name, $size, $iscommercial, $ispublic, $street, $city, $zip, $propertytype, $owner, NULL);
--add initial crop/animal
INSERT INTO Has
VALUES ($propertyid, $itemName);

/* Owner functionality */
--default view of owners properties
SELECT 
	Name,
	Street as Address,
	City,
	Zip,
	Size,
	PropertyType as Type,
	(CASE WHEN IsPublic = 1 THEN 'True' ELSE 'False') as Public,
	(CASE WHEN IsCommercial = 1 THEN 'True' ELSE 'False') as Commercial,
	ID,
	(CASE WHEN ApprovedBy = NULL THEN 'False' ELSE 'True') as isValid,
	COUNT(Visit.*),
FROM 

