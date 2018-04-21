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

CASE WHEN ApprovedBy = NULL
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

CASE WHEN ApprovedBy = NULL
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

CASE WHEN ApprovedBy = NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) , AVG( Rating )
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

CASE WHEN ApprovedBy = NULL
THEN 'False'
ELSE 'True'
END
) AS isValid, COUNT( * ) , AVG( Rating )
FROM Property, Visit
WHERE Owner != $owner and $searchby = $search
GROUP BY ID
ORDER BY $order 
--view property details
 SELECT P . * , SUM(
CASE WHEN FarmItem.Type = 'ANIMAL'
THEN 0
ELSE 1
END ) AS Crops, SUM(
CASE WHEN FarmItem.Type = 'ANIMAL'
THEN 1
ELSE 0
END ) AS Animals
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
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'AvgRating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
GROUP BY Property.ID
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
) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'AvgRating'
FROM Property
JOIN Visit ON Visit.PropertyID = Property.ID
WHERE Property.IsPublic = 1
AND Property.ApprovedBy IS NOT NULL
AND $searchby = $search
GROUP BY Property.ID

/* Manage properties for owners */
