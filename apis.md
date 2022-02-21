- GET api.xxx.xxx/sheets/${sheet-id}/data?${title1}=${value1}&${title2}=${value2}
    - headers:
        - [optional] api-version: v1
        - [optional] titles-splitter: ,
        - [optional] included-titles: ${title1},${title2}
        - [optional] excluded-titles: ${title3},${title4}

- GET api.xxx.xxx/sheets/${sheet-id}/schema
    - headers:
        - [optional] api-version: v1

- Querying
    - equal to
        - ?day=20220215
    - $lt, $lte, $gt, $gte, $ne
        - ?day$lt=20220215
        - ?day$lte=20220215
        - ?day$gt=20220215
        - ?day$gte=20220215
        - ?day$ne=20220215
    - $or
        - ?$or[0]day=20220215&$or[0]id$gt=18&$or[1]day=20220216&$or[1]id$lt=6
            - find records from 20220215 06:00 PM to 20220216 06:00 AM
    - $like
        - ?name$like=jacky
    - $in, $nin
        - ?day$in=20220215&day$in=20220216
        - ?day$nin=20220215&day$nin=20220216
    
    - $select, $deselect
        - ?$select=day&$select=holiday&$select=exchange
        - ?$deselect=id&$deselect=description
        
    - $skip
        - ?$skip=2
    - $limit
        - ?$limit=2
    
    - $sort
        - ?$sort=+day&$sort=time&$sort=-id
    
    
    
