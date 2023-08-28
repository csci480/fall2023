import Column from "./column";
// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-
// Note: ensure that your Google Sheets "Share" setting is Public Read-only.

const buildTableHeaderRow = () => {
    const ths = [];

    for (let key in state.columns) {
        const col = state.columns[key];
        let colNameElement = `<span>${col.name}</span>`;
        let colFilterElement = "";

        // if (col.sortable) {
        //     colNameElement = `<a href="#" data-key="${key}"
        //         class="sort ${state.columns[state.sortColumn].sortDirection} ${
        //         state.sortColumn === key ? "active" : ""
        //     }" >
        //             ${col.name}
        //         </a>`;
        // }
        // if (col.filterable) {
        //     let extraClasses = "";
        //     if (col.filters.length != col.values.length) {
        //         extraClasses = "active";
        //     }
        //     colFilterElement = `<i class="fa fa-filter ${extraClasses}" data-key="${key}"></i>`;
        // }

        ths.push(`
            <th id="th-${key}" style="width: ${
            col.colWidth ? col.colWidth : "auto"
        };">
                ${colNameElement}
                ${colFilterElement}
            </th>
        `);
    }
    return `<tr>${ths.join("")}</tr>`;
};

const rowsToTable = (rows) => {
    const tableRows = [];
    rows.forEach((row) => {
        let tags = "";
        if (row.tags.length > 0) {
            tags = `<span class="tag">${row.tags.join(
                '</span><span class="tag">'
            )}</span>`;
        }
        tableRows.push(`
            <tr>  
            ${Object.keys(state.columns)
                .map((key) => {
                    return `<td>${row[key]}</td>`;
                })
                .join("\n")}
            </tr>
        `);
        // tableRows.push(`
        //     <tr>
        //         <td>${row.category}</td>
        //         <td>
        //             <a href="${row.link}" target="_blank">${row.description}</a>
        //             ${row.notes ? '<p class="notes">' + row.notes + "</p>" : ""}
        //             </td>
        //         <td>${tags}</td>
        //     </tr>
        // `);
    });
    const headerRow = buildTableHeaderRow();
    return `
        <table>
            <thead>${headerRow}</thead>
            <tbody>${tableRows.join("")}</tbody>
        </table>`;
};

const sortByColumn = () => {
    const key = state.sortColumn,
        direction = state.columns[state.sortColumn].sortDirection,
        data = state.filteredRows || state.rows;
    dataType = state.columns[key].data_type;
    const multiplier = direction === "desc" ? -1 : 1;

    const stringSorter = (a, b) => {
        return a[key].localeCompare(b[key]) * multiplier;
    };

    const listSorter = (a, b) => {
        let first = a[key];
        let second = b[key];
        // sort by first item (blanks always at the bottom)
        first = first.length > 0 ? first[0] : "";
        second = second.length > 0 ? second[0] : "";
        if (first === "") return 1 * multiplier;
        if (second === "") return -1 * multiplier;
        return first.localeCompare(second) * multiplier;

        // sort by length of lists
        // first = first.length;
        // second = second.length;
        // return (first - second) * multiplier;
    };

    if (dataType === "list") {
        data.sort(listSorter);
    } else {
        data.sort(stringSorter);
    }
};

const filterData = () => {
    const rows = JSON.parse(JSON.stringify(state.rows));
    // const categoryFilters = state.columns.category.filters;
    // const tagFilters = state.columns.tags.filters;

    // if (categoryFilters.length + tagFilters.length === 0) {
    //     state.filteredRows = null;
    // }

    // state.filteredRows = [];
    // rows.forEach((row) => {
    //     const categoryMatch =
    //         categoryFilters.length === state.columns.category.values.length ||
    //         categoryFilters.includes(row.category);
    //     const tagMatch =
    //         tagFilters.length === state.columns.tags.values.length ||
    //         tagFilters.some((a) => row.tags.includes(a));
    //     // console.log(categoryMatch, tagMatch, row.category, row.tags)
    //     if (categoryMatch && tagMatch) {
    //         state.filteredRows.push(row);
    //     }
    // });
    state.filteredRows = rows;
};

const getDistinctValues = (data, key) => {
    let values = [];
    data.forEach((row) => {
        const item = row[key];
        if (Array.isArray(item)) {
            values = values.concat(...item);
        } else {
            values.push(item);
        }
    });
    return [...new Set(values)].sort();
};

const processData = (data) => {
    const headerRow = data.values.shift();
    // console.log(headerRow);
    const rows = [];
    data.values.forEach((row) => {
        console.log(row);
        const headers = [
            "timestamp",
            "name",
            "url",
            "title",
            "organization",
            "time_scale",
            "skills_needed",
            "location",
            "salary",
            "classification",
            "why",
        ];
        const rec = {
            tags: [],
        };
        headers.forEach((key, idx) => {
            rec[key] = row[idx];
        });

        const additionalTags = rec.skills_needed || "";
        additionalTags.split(",").forEach((tag) => {
            tag = tag.trim();
            if (tag.length > 0) {
                rec.tags.push(tag);
            }
        });

        rec.tags.sort(); // sort tags after list is built

        rows.push(rec);
    });
    console.log(rows);
    return rows;
};

const attachEventHandlers = () => {
    document.querySelectorAll("a.sort").forEach((a) => {
        // console.log(a);
        a.onclick = sortTable;
    });

    document.querySelectorAll(".fa-filter").forEach((a) => {
        // console.log(a);
        a.onclick = showFilterBox;
    });
};

const sortTable = (ev) => {
    document.querySelector("table").remove();

    const elem = ev.currentTarget;
    state.sortColumn = elem.getAttribute("data-key");
    renderTable();

    if (state.columns[state.sortColumn].sortDirection === "asc") {
        state.columns[state.sortColumn].sortDirection = "desc";
    } else {
        state.columns[state.sortColumn].sortDirection = "asc";
    }
    ev.preventDefault();
};

const showFilterBox = (ev) => {
    const elem = ev.currentTarget;
    const id = elem.getAttribute("data-key");
    let div = document.getElementById(`filter-${id}`);
    if (div) {
        hideFilterMenus();
    } else {
        hideFilterMenus();
        renderFilterBox(id);
    }
    ev.preventDefault();
    ev.stopPropagation();
};

const hideFilterMenus = () => {
    document.querySelectorAll(`div[id^=filter-]`).forEach((div) => {
        div.remove();
    });
};

const updateFilterBoxPosition = () => {
    let div = document.querySelector(`div[id^=filter-]`);
    if (div) {
        const id = div.getAttribute("data-key");
        const parent = document.querySelector(`#th-${id}`);
        const w = parent.offsetWidth + 2;
        const y =
            parent.getBoundingClientRect().top +
            window.scrollY +
            parent.offsetHeight -
            2;
        const x = parent.getBoundingClientRect().left;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${w}px`;
    }
};

const renderFilterBox = (id) => {
    console.log(`#th-${id}`);
    let cbList = [];
    state.columns[id].values.forEach((option) => {
        cbList.push(`<input type="checkbox" value="${option}"
            ${state.columns[id].filters.includes(option) ? "checked" : ""}>
            ${option}<br>`);
    });
    const ratio =
        state.columns[id].filters.length / state.columns[id].values.length;
    const batchOption = ratio > 0.5 ? "deselect" : "select";
    const batchButton = `<a id="filter-${id}-${batchOption}" href="#">
        ${batchOption} all</a>`;
    const div = `
        <div class="box" id="filter-${id}" data-key="${id}">
                ${batchButton}<br><br>
                ${cbList.join("")}
        </div>`;
    document.body.insertAdjacentHTML("beforeend", div);
    // set the position:
    updateFilterBoxPosition();

    // add event handlers:
    document.querySelectorAll(`#filter-${id} input`).forEach((cb) => {
        cb.onclick = updateFilterAndRedraw;
    });
    document.getElementById(`filter-${id}`).onclick = (ev) => {
        ev.stopPropagation();
    };

    const handleBatchFilterUpdate = (ev) => {
        const elem = ev.currentTarget;
        const flag = elem.innerHTML.indexOf("deselect") >= 0 ? false : true;
        document.querySelectorAll(`#filter-${id} input`).forEach((cb) => {
            cb.checked = flag;
        });
        updateFilterAndRedraw(ev);
        ev.preventDefault();
    };

    if (batchOption === "deselect") {
        document.querySelector(`#filter-${id}-deselect`).onclick =
            handleBatchFilterUpdate;
    } else {
        document.querySelector(`#filter-${id}-select`).onclick =
            handleBatchFilterUpdate;
    }
};

const updateFilterAndRedraw = (ev) => {
    const elem = ev.currentTarget;
    const id = elem.parentElement.id;
    const col = id.split("-")[1];
    console.log(col, `filter-${col}`);
    state.columns[col].filters = [];
    document.querySelectorAll(`#${id} input`).forEach((cb) => {
        if (cb.checked) {
            state.columns[col].filters.push(cb.value);
        }
    });
    // console.log(state);
    document.querySelector("table").remove();
    renderTable();

    // redraw filter box
    document.getElementById(`filter-${col}`).remove();
    renderFilterBox(col);
    ev.stopPropagation();
};

const renderTable = () => {
    console.log(state.rows);
    filterData();
    sortByColumn();
    document.body.insertAdjacentHTML(
        "beforeend",
        rowsToTable(state.filteredRows || state.rows)
    );
    attachEventHandlers();
};

const init = () => {
    if (!key) {
        alert(
            "please define a variable called key that has your Google API key"
        );
    }
    if (!sheetsId) {
        alert(
            "please define a variable called sheetsId that has your Google sheets ID"
        );
    }

    if (!tabName) {
        alert(
            "please define a variable called tabName that has the name of the tab (e.g., Sheet1)"
        );
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${tabName}?key=${key}`;

    fetch(url, {
        referrer: "https://vanwars.github.io/google-sheets/",
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            state.rows = processData(data);
            // state.columns.category.values = getDistinctValues(state.rows, 'category');
            // state.columns.category.filters = [...state.columns.category.values];
            // state.columns.tags.values = getDistinctValues(state.rows, 'tags');
            // state.columns.tags.filters = [...state.columns.tags.values];
            renderTable();
        });

    /************************
     * Global event handlers
     * **********************/
    // if filter box is open, this keeps its position if user scrolls:
    window.onscroll = updateFilterBoxPosition;

    // if filter box is visible, hide it:
    document.body.onclick = hideFilterMenus;
};

init();
