# gr.api.sheet
Transfer xlsx files as restful querying apis

Each sheet will be transfer as one restful querying api.

## Supported Files
xlsx files with datatable-like sheets

datatable-like means:
- the first row is data header
- other rows are data

## Supported Datatypes
- number for integer, float
- string for others


## Supported Query Functions
- Equality
- $lt, $lte, $gt, $gte
- $in, $ne
- $like
- $or
- $select, $deselect
- $skip, $limit, $sort

See [APIs](./api_docs/apis.md) for details.

## Usage Examples
### List Sheets
- Request: Get http://localhost:5208/sheets
- Response:
```json
{
  "count": 1,
  "data": [
    {
      "sheetId": "3584589747",
      "filepath": "test_files/us-stock-holiday.xlsx",
      "sheetName": "us-stock-holiday",
      "schema": [
        {
          "title": "ID",
          "dataType": "number"
        },
        {
          "title": "Day",
          "dataType": "number"
        },
        {
          "title": "Exchange",
          "dataType": "string"
        },
        {
          "title": "Holiday",
          "dataType": "string"
        },
        {
          "title": "Description",
          "dataType": "string"
        }
      ]
    }
  ]
}
```

### Query In Sheet
- Request: Get http://localhost:5208/sheets/3584589747?$limit=1&$sort=-id
- Response:
```json
{
  "count": 1,
  "data": [
    {
      "ID": 54,
      "Day": 20221226,
      "Exchange": "NYSE",
      "Holiday": "Christmas Day",
      "Description": ""
    }
  ]
}
```

# Quick Start
```shell
cd ~/Downloads/
git clone https://github.com/leidongR/gr.api.sheet
cd gr.api.sheet
yarn && yarn run dev
```