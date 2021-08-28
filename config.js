const key = 'AIzaSyDsr4u1uupvnmDSfJdfgHZN2IWROiihlP8';
const sheetsId = '1M6lIxSbYaTI3lTkPvDbd-Ex4P0EX-2R9oEvxKYbncEc';
const state = {
    sortColumn: 'category',
    sortDirection: 'asc',
    rows: [],
    filteredRows: [],
    columns: {
        'category': {
            name: 'Category',
            data_type: 'string',
            values: [],
            filters: [],
            filterable: true,
            sortable: true,
            colWidth: '200px'
        },
        'description': {
            name: 'Description',
            data_type: 'string',
            values: [],
            filterable: false,
            sortable: true
        },
        'tags': {
            name: 'Tags',
            data_type: 'list',
            values: [],
            filters: [],
            filterable: true,
            sortable: true,
            colWidth: '250px'
        }
    }
};