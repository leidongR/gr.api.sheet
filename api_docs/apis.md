# API: GET /sheets

This api will list all sheets including sheet schema info.

## Querying

### schema=false

Add this querying item to ignore output schema info

# API: GET /sheets/${sheetId}

This api will output rows in the sheet matching querying conditions

sheetId can be found in /sheets result


## Querying

- Column name is case-insensitive

### Equality (=)

Find rows with assigned column value.

#### Datatypes

- number 
- string

#### Examples

```
GET http://localhost:5208/sheets/3584589747?day=20170116
GET http://localhost:5208/sheets/3584589747?exchange=NYSE
```

### $lt, $lte, $gt, $gte

Compare column value with assigned value on each row, return passed rows

- $lt: less than
- $lte: less than or equal to
- $gt: greater than
- $gte: greater than or equal to

#### Datatypes

- number 
- string

#### Examples

```
GET http://localhost:5208/sheets/3584589747?day$lt=20201231
GET http://localhost:5208/sheets/3584589747?exchange$gte=M
```

### $in

Find rows which column value does match any of the given values

#### Datatypes

- number 
- string

#### Examples

```
GET http://localhost:5208/sheets/3584589747?day$in=20170102&day$in=20170220
```

### $ne

Find rows which column value does not match any of the given values

#### Datatypes

- number 
- string

#### Examples

```
GET http://localhost:5208/sheets/3584589747?day$ne=20170102&day$ne=20170220
```

### $like

Find rows which column value contains assigned substring

#### Datatypes

- string

#### Examples

```
GET http://localhost:5208/sheets/3584589747?holiday$like=New%20Years
```

### $or

Find rows which match any of the given grouping conditions.
Use $or[${groupId}] as prefix of other conditions

#### Examples

```
GET http://localhost:5208/sheets/3584589747?$or[0]day$gte=20200101&$or[0]holiday=Christmas&$or[1]day$lt=20200101&$or[1]holiday$like=Washington
```

The querying request above is equivalent to two querying requests below and merged their result:
```
GET http://localhost:5208/sheets/3584589747?day$gte=20200101&holiday=Christmas
GET http://localhost:5208/sheets/3584589747?day$lt=20200101&holiday$like=Washington
```

### $select, $deselect

Used to select or ingore columns in result

#### Examples

```
GET http://localhost:5208/sheets/3584589747?$select=day&$select=holiday&$select=exchange
GET http://localhost:5208/sheets/3584589747?$deselect=id
```

### $skip

Used to skip first N rows in result

#### Examples

```
GET http://localhost:5208/sheets/3584589747?$skip=10
```

### $limit

Used to limit the number of rows in result

#### Examples

```
GET http://localhost:5208/sheets/3584589747?$limit=10
```

### $sort

Used to sort rows in result. As default, rows is ordered by row number in xlsx sheet.

- $sort=+${columnName}, sort by assigned column in ascending order
- $sort=${columnName}, same with $sort=+${columnName}
- $sort=-${columnName}, sort by assigned column in descending order

Note: If there are multi $sort assinged, the left condition takes precedence.

For request below, rows will be sorted by Holiday asc, if the Holiday are same, then sorted by Day desc.

#### Examples

```
GET http://localhost:5208/sheets/3584589747?$sort=Holiday&$sort=-day&$skip=2&$limit=50
```