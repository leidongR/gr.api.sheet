- GET api.xxx.xxx/sheets/${sheet-id}/data?${title1}=${value1}&${title2}=${value2}
    - headers:
        - [optional] api-version: v1
        - [optional] titles-splitter: ,
        - [optional] included-titles: ${title1},${title2}
        - [optional] excluded-titles: ${title3},${title4}

- GET api.xxx.xxx/sheets/${sheet-id}/schema
    - headers:
        - [optional] api-version: v1
