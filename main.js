// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-0

// Note: ensure that your Google Sheets "Share" setting is Public Read-only.
if (!key) {
    alert('please define a variable called key that has your Google API key');
}
if (!sheetsId) {
    alert('please define a variable called sheetsId that has your Google sheets ID');
}
const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Sheet1?key=${key}`;

const state = {
    sortColumn: 'category',
    sortDirection: 'asc',
    rows: [],
    filteredRows: [],
    columns: {
        'category': {
            data_type: 'string',
            values: [],
            filters: [],
            filterable: true,
            sortable: true
        },
        'description': {
            data_type: 'string',
            values: [],
            filterable: false,
            sortable: true
        },
        'tags': {
            data_type: 'list',
            values: [],
            filters: [],
            filterable: true,
            sortable: false
        }
    }
};
fetch(url)
    .then(response => response.json())
    .then(data => {
        state.rows = processData(data);
        state.columns['category'].values = getDistinctValues(state.rows, 'category');
        state.columns['category'].filters = [...state.columns['category'].values];
        state.columns['tags'].values = getDistinctValues(state.rows, 'tags');
        state.columns['tags'].filters = [...state.columns['tags'].values];
        console.log(state);
        renderTable();
    });

const rowsToTable = rows => {
    const tableRows = [];
    rows.forEach(row => {
        let tags = '';
        if (row.tags.length > 0) {
            tags = `<span class="tag">${row.tags.join('</span><span class="tag">')}</span>`;
        }
        tableRows.push(`
            <tr>
                <td>${row.category}</td>
                <td>
                    <a href="${row.link}" target="_blank">${row.description}</a>
                    </td>
                <td>${tags}</td>
            </tr>
        `);
    });
    return `
        <table>
            <tr>
                <th>
                    <a href="#" class="sort ${state.sortDirection} ${(state.sortColumn === 'category') ? 'active' : ''}" data-key="category">Category</a>
                    <i class="fa fa-filter" data-key="category"></i>
                </th>
                <th>
                    <a href="#" class="sort ${state.sortDirection} ${(state.sortColumn === 'description') ? 'active' : ''}" data-key="description">Link</a>
                </th>
                <th>
                    <span>Tags</span>
                    <i class="fa fa-filter" data-key="tags"></i>
                </th>
            </tr>
            ${tableRows.join('')}
        </table>`;
};

const sortByColumn = () => {
    const key = state.sortColumn,
        direction = state.sortDirection,
        data = state.filteredRows || state.rows;
    const multiplier = direction === 'desc' ? -1 : 1;
    data.sort((a, b) => {
        const comparison = a[key].localeCompare(b[key]) * multiplier;
        return comparison;
    });
};

const filterData = () => {
    const rows = JSON.parse(JSON.stringify(state.rows));
    const categoryFilters = state.columns.category.filters;
    const tagFilters = state.columns.tags.filters;

    if (categoryFilters.length + tagFilters.length === 0) {
        state.filteredRows = null;
    }

    state.filteredRows = []
    rows.forEach(row => {
        const categoryMatch = (
            categoryFilters.length === state.columns.category.values.length || 
            categoryFilters.includes(row.category)
        );
        const tagMatch = (
            tagFilters.length === state.columns.tags.values.length || 
            tagFilters.some(a => row.tags.includes(a))
        );
        // console.log(categoryMatch, tagMatch, row.category, row.tags)
        if (categoryMatch && tagMatch) {
            state.filteredRows.push(row)
        }
    });
};

const getDistinctValues = (data, key) => {
    let values = [];
    data.forEach(row => {
        const item = row[key];
        if (Array.isArray(item)) {
            values = values.concat(...item);
        } else {
            values.push(item);
        }
    });
    return [...new Set(values)].sort();
};

const processData = data => {
    const headerRow = data.values.shift();
    // console.log(headerRow);
    const rows = [];
    data.values.forEach(row => {
        const rec = {
            category: row[0],
            description: row[1],
            link: row[2],
            isSurveillance: row[3] === 'Y',
            isToolOfResistance: row[4] === 'Y',
            isCrt: row[5] === 'Y',
            isFacialRecognition: row[6] === 'Y',
            isAutomation: row[7] === 'Y',
            isDataCapitalism: row[8] === 'Y',
            isGuidebook: row[9] === 'Y',
            tags: []
        }
        if (rec.isSurveillance) rec.tags.push('surveillance');
        if (rec.isToolOfResistance) rec.tags.push('tool of resistance');
        if (rec.isCrt) rec.tags.push('critical race theory');
        if (rec.isFacialRecognition) rec.tags.push('facial recognition');
        if (rec.isAutomation) rec.tags.push('automation');
        if (rec.isDataCapitalism) rec.tags.push('data capitalism');
        if (rec.isGuidebook) rec.tags.push('guidebook');

        rows.push(rec);
    });
    // console.log(rows);
    return rows;
};

const attachEventHandlers = () => {
    document.querySelectorAll('a.sort').forEach(a => {
        // console.log(a);
        a.onclick = sortTable;
    });

    document.querySelectorAll('.fa-filter').forEach(a => {
        // console.log(a);
        a.onclick = showFilterBox;
    });
};

const sortTable = ev => {
    document.querySelector('table').remove();

    const elem = ev.currentTarget;
    if (elem.classList.contains('asc')) {
        state.sortDirection = 'desc';
    } else {
        state.sortDirection = 'asc';
    }
    state.sortColumn = elem.getAttribute('data-key');

    renderTable();
    ev.preventDefault();
};

const showFilterBox = ev => {
    const elem = ev.currentTarget;
    const id = elem.getAttribute('data-key');
    let div = document.getElementById(`filter-${id}`);
    
    if (div) {
        div.remove();
    } else {
        const parent = elem.parentElement;
        const w = parent.offsetWidth + 2;
        const y = parent.getBoundingClientRect().top + window.scrollY + parent.offsetHeight - 2;
        const x = parent.getBoundingClientRect().left;
        let cbList = [];
        state.columns[id].values.forEach(option => {
            cbList.push(`<input type="checkbox" value="${option}"
                ${state.columns[id].filters.includes(option) ? 'checked' : ''}>
                ${option}<br>`);
        });
        const div = `
            <div class="box" id="filter-${id}"
                style="width: ${w}px; top: ${y}px; left: ${x}px;">
                    <a id="filter-${id}-batch-select" href="#">Deselect All</a><br><br>
                    ${cbList.join('')}
            </div>`;
        document.body.insertAdjacentHTML('beforeend', div);
        document.querySelectorAll(`#filter-${id} input`).forEach(cb => {
            cb.onclick = updateFilterAndRedraw;
        });
        document.querySelector(`#filter-${id}-batch-select`).onclick = ev => {
            document.querySelectorAll(`#filter-${id} input`).forEach(cb => {
                cb.checked = false;
            });
            updateFilterAndRedraw(ev);
            ev.preventDefault();
        }
    }
    ev.preventDefault();
};

const updateFilterAndRedraw = ev => {
    const elem = ev.currentTarget;
    const id = elem.parentElement.id;
    const col = id.split('-')[1];
    state.columns[col].filters = [];
    document.querySelectorAll(`#${id} input`).forEach(cb => {
        if(cb.checked) {
            state.columns[col].filters.push(cb.value);
        }
    });
    // console.log(state);
    document.querySelector('table').remove();
    renderTable();
};

const renderTable = () => {
    filterData();
    sortByColumn();
    const tableHTML = rowsToTable(state.filteredRows || state.rows);
    document.body.insertAdjacentHTML('beforeend', tableHTML);
    attachEventHandlers();
};
