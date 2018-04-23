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
	Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, (

CASE WHEN ApprovedBy IS NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) , AVG( Rating )
FROM Property, Visit
WHERE Owner = $owner
GROUP BY ID;
--search by term filter
SELECT
	Name,
	Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (
CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, (

CASE WHEN ApprovedBy IS NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) , AVG( Rating )
FROM Property, Visit
WHERE $searchby = $search
GROUP BY ID;

/* View other owner's properties */
--get all other valid properties (not including current logged in owner)
SELECT Name,
Street AS Address,
City,
Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, (

CASE WHEN ApprovedBy IS NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) as Visits , AVG( Rating ) as 'Avg.Rating'
FROM Property, Visit
WHERE Owner != $owner
GROUP BY ID
ORDER BY $order
--search by term filter
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, (

CASE WHEN ApprovedBy IS NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) , AVG( Rating )
FROM Property, Visit
WHERE Owner != $owner and $searchby = $search
GROUP BY ID
ORDER BY $order
--view property details
 SELECT P . * , FarmItem.Name, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
FROM (

SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, Size AS 'Size (acres)', AVG( Rating ) , PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, Property.ID AS ID
FROM Property
JOIN User ON Property.Owner = User.Username
JOIN Has ON Property.ID = Has.PropertyID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.ID =$id
) AS P
JOIN Has ON Has.PropertyID = P.ID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
/* Manage properties for owners */
--initial data population of screen
SELECT
Name,
Street as Address,
City,
Zip,
Size,
PropertyType as Type,
(CASE WHEN IsPublic =1 THEN 'True' ELSE 'False' END) AS Public,
(CASE WHEN IsCommercial =1 THEN 'True' ELSE 'False' END) AS Commercial,
ID
FROM Property
WHERE Property.Owner = $owner and Property.ID = $id
--check if new property name doesnt exist yet
SELECT *
FROM Property
WHERE ID != $id AND Name = $name
--get list of crops that this property grows
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type != 'ANIMAL'
--get list of animals that this farm raises
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type = 'ANIMAL'
--get list of new crops that can be added to the property
SELECT Name
FROM FarmItem
WHERE FarmItem.Type != 'ANIMAL'
AND FarmItem.IsApproved = True
AND NOT
EXISTS (
SELECT *
FROM Has
WHERE Has.ItemName = FarmItem.Name
AND Has.PropertyID =$id
);
--get list of new animals that can be added to the property
SELECT Name
FROM FarmItem
WHERE FarmItem.Type = 'ANIMAL'
AND FarmItem.IsApproved = True
AND NOT
EXISTS (
SELECT *
FROM Has
WHERE Has.ItemName = FarmItem.Name
AND Has.PropertyID =$id
);
--get list of previous crops to check if it already exists
SELECT Name
FROM FarmItem
WHERE FarmItem.Name = $name
--add new crop/animal to farmitem to be reviewed
INSERT INTO FarmItem VALUES ($name, False, $type);
--delete Property
DELETE FROM Property
WHERE ID = $id
--update property
UPDATE Property
SET Name = $name, Size = $size, IsCommercial = $commercial, IsPublic = $public, Street = $street,City = $city, Zip = $zip
WHERE ID = $id
--update new crop/animal (approved)
INSERT INTO Has VALUES ($propertyid, $itemname)
--Delete crop or animal
DELETE FROM Has WHERE ItemName = $itemname AND PropertyID = $id

/* Add Property- Owner functionality*/
--check that new property name doesnt already exist
SELECT * FROM Property WHERE Name = $name;
--Add new farm property
SELECT MAX(ID) FROM Property --find largest property id
INSERT INTO Property VALUES ($id, $name, $size, $commerical, $public, $street, $city, $zip, $propertytype, $ownerusername, NULL);
INSERT INTO Has VALUES ($propertyid, $animal);
INSERT INTO Has Values ($propertyid, $crop);
--Add new garden/orchard property
SELECT MAX(ID) FROM Property --find largest property id
INSERT INTO Property VALUES ($id, $name, $size, $commerical, $public, $street, $city, $zip, $propertytype, $ownerusername, NULL);
INSERT INTO Has VALUES ($propertyid, $animal);
INSERT INTO Has Values ($propertyid, $crop);

/* Visitor Functionality */
--initial public, validated properties table population
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
--search by term filter if its just 2 parameters
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
AND $searchby = $search
GROUP BY Property.ID
--search by term filter if user passes in a range for Visits
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
HAVING COUNT(*) BETWEEN $min AND $max
--search by term filter if user passes in a range for avg rating
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
HAVING AVG(Rating) BETWEEN $min AND $max
--search by term filter if user passes in one number for Visits
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
HAVING COUNT(*) = $search
--search by term filter if user passes in one number for avg rating
SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
HAVING AVG(Rating) = $search
--visited details: where visitors can log their visit and rating
SELECT P . * , FarmItem.Name as FarmItem, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
FROM (

SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, AVG(Rating) as 'Avg.Rating', Size AS 'Size (acres)', PropertyType AS
TYPE , COUNT(* ) as Visits, (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, Property.ID AS ID
FROM Property
JOIN User ON Property.Owner = User.Username
JOIN Has ON Property.ID = Has.PropertyID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.ID =$id
) AS P
JOIN Has ON Has.PropertyID = P.ID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
--log new rating with logged date
INSERT INTO Visit VALUES ($username, $propertyid, CURRENT_TIMESTAMP, $rating);
--unlog a visit
DELETE FROM Visit WHERE Username = $username AND PropertyID = $id
--visitors visit history
SELECT Property.Name, Visit.VisitDate, Visit.Rating, Property.ID
FROM Visit JOIN Property ON Property.ID = Visit.PropertyID
WHERE Visit.Username = $username
--see if visitor has already logged for a property
SELECT *
FROM Visit
WHERE PropertyID = $id AND Username = $username

/* Administrator functionality */
--view unconfirmed properties
SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (
CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, Owner
FROM Property
WHERE ApprovedBy IS NULL;
--search by filter terms
SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (
CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, Owner
FROM Property
WHERE ApprovedBy IS NULL and $searchby = $search
--admin viewing details of unconfirmed property
SELECT P . * , FarmItem.Name as item, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
FROM (

SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, Size AS 'Size (acres)', AVG( Rating ) , PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, Property.ID AS ID
FROM Property
JOIN User ON Property.Owner = User.Username
JOIN Has ON Property.ID = Has.PropertyID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.ID =$id
) AS P
JOIN Has ON Has.PropertyID = P.ID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
--check if new property name doesnt exist yet
SELECT *
FROM Property
WHERE ID != $id AND Name = $name
--get list of crops that this property grows
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type != 'ANIMAL'
--get list of animals that this farm raises
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type = 'ANIMAL'
--get list of new crops that can be added to the property
SELECT Name
FROM FarmItem
WHERE FarmItem.Type != 'ANIMAL'
AND FarmItem.IsApproved = True
AND NOT
EXISTS (
SELECT *
FROM Has
WHERE Has.ItemName = FarmItem.Name
AND Has.PropertyID =$id
);
--get list of new animals that can be added to the property
SELECT Name
FROM FarmItem
WHERE FarmItem.Type = 'ANIMAL'
AND FarmItem.IsApproved = True
AND NOT
EXISTS (
SELECT *
FROM Has
WHERE Has.ItemName = FarmItem.Name
AND Has.PropertyID =$id
);
--get list of previous crops to check if it already exists
SELECT Name
FROM FarmItem
WHERE FarmItem.Name = $name
--add new crop/animal to farmitem to be reviewed
INSERT INTO FarmItem VALUES ($name, False, $type);
--delete Property
DELETE FROM Property
WHERE ID = $id
--save changes (confirm property)
UPDATE Property
SET Name = $name, Size = $size, IsCommercial = $commercial, IsPublic = $public, Street = $street,City = $city, Zip = $zip, ApprovedBy = $adminusername
WHERE ID = $id
--update new crop/animal (approved)
INSERT INTO Has VALUES ($propertyid, $itemname)
--view confirmed properties
SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (
CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, ApprovedBy as VerifiedBy, AVG(Rating)
FROM Property JOIN Visit ON Visit.PropertyID = Property.ID
WHERE ApprovedBy IS NOT NULL
GROUP BY Name;
--search by filter terms
SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (
CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, ID, Owner
FROM Property
WHERE ApprovedBy IS NULL and $searchby = $search
--admin viewing details of unconfirmed property
SELECT P . * , FarmItem.Name, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
FROM (

SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, Size AS 'Size (acres)', AVG( Rating ) , PropertyType AS
TYPE , (

CASE WHEN IsPublic =1
THEN 'True'
ELSE 'False'
END
) AS Public, (

CASE WHEN IsCommercial =1
THEN 'True'
ELSE 'False'
END
) AS Commercial, Property.ID AS ID
FROM Property
JOIN User ON Property.Owner = User.Username
JOIN Has ON Property.ID = Has.PropertyID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.ID =$id
) AS P
JOIN Has ON Has.PropertyID = P.ID
JOIN FarmItem ON FarmItem.Name = Has.ItemName
--check if new property name doesnt exist yet
SELECT *
FROM Property
WHERE ID != $id AND Name = $name
--get list of crops that this property grows
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type != 'ANIMAL'
--get list of animals that this farm raises
SELECT ItemName
FROM Has
JOIN FarmItem ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID = $id AND FarmItem.Type = 'ANIMAL'
--get list of new crops that can be added to the property
SELECT Name
FROM FarmItem LEFT JOIN Has ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID != $id AND FarmItem.Type != 'ANIMAL' AND FarmItem.IsApproved = True;
--get list of new animals that can be added to the property
SELECT Name
FROM FarmItem LEFT JOIN Has ON FarmItem.Name = Has.ItemName
WHERE Has.PropertyID != $id AND FarmItem.Type = 'ANIMAL' AND FarmItem.IsApproved = True;
--get list of previous crops to check if it already exists
SELECT Name
FROM FarmItem
WHERE FarmItem.Name = $name
--add new crop/animal to farmitem to be reviewed
INSERT INTO FarmItem VALUES ($name, False, $type);
--delete Property
DELETE FROM Property
WHERE ID = $id
--save changes (confirm property)
UPDATE Property
SET Name = $name, Size = $size, IsCommercial = $commercial, IsPublic = $public, Street = $street,City = $city, Zip = $zip, ApprovedBy = $adminusername
WHERE ID = $id
--update new crop/animal (approved)
INSERT INTO Has VALUES ($propertyid, $itemname)
--all visitors list (initial population of table)
SELECT User.Username, User.Email, COUNT(VisitDate) as LoggedVisits
FROM User LEFT JOIN Visit ON Visit.Username = User.Username
WHERE User.UserType = 'VISITOR'
GROUP BY Username;
--search by search term
SELECT User.Username, User.Email, COUNT(*) as LoggedVisits
FROM User JOIN Visit ON Visit.Username = User.Username
WHERE User.UserType = 'VISITOR' AND $searchby = $search
GROUP BY Username;
--delete visitor account
DELETE FROM User WHERE Username = $visitorusername
--delete visitor's log history
DELETE FROM Vist WHERE Username = $visitorusername
--all owners list (initial population of table)
SELECT User.Username, User.Email, COUNT(*) as NumProperties
WHERE User.UserType = 'OWNER'
GROUP BY Username;
--search by search term
SELECT User.Username, User.Email, COUNT(*) as LoggedVisits
WHERE User.UserType = 'OWNER' AND $searchby = $search
GROUP BY Username;
--delete owner account
DELETE FROM User WHERE Username = $visitorusername
--approved animals/crops list
SELECT Name, Type
FROM FarmItem
WHERE IsApproved = True;
--add to approved list
INSERT INTO FarmItem VALUES ($itemname, True, $type);
--search by search term
SELECT Name, Type
FROM FarmItem
WHERE IsApproved = True AND $searchby = $search
--pending approval animals/crops list
SELECT Name, Type
FROM FarmItem
WHERE IsApproved = False;
--approve selection
UPDATE FarmItem
SET IsApproved = True
WHERE Name = $name;
--delete selection
DELETE FROM FarmItem
WHERE Name = $name;
