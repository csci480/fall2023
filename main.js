import Column from "./column.js";
import Row from "./row.js";
import config from "./config.js";
// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-
// Note: ensure that your Google Sheets "Share" setting is Public Read-only.

class Table {
    constructor(config) {
        this.config = config;
        this.columns = [];
        this.rows = [];
        this.columnMap = {};

        // throws error if not valid:
        this.validateConfig();

        // this.initColumns();
        this.fetchData();
    }

    initColumnsAndRows(data) {
        this.columns = config.columns.map((col, idx) => new Column(col, idx));
        this.columns.forEach((col) => (this.columnMap[col.id] = col));

        data.forEach((rec) => {
            this.rows.push(new Row(rec, this.columns));
        });
    }

    clearColumnData() {
        this.columns.forEach((col) => (col.cells = []));
    }

    // setColumnData(rows) {
    //     rows.forEach((row) => {
    //         this.columns.forEach((col, idx) => {
    //             col.addCell(row[idx]);
    //         });
    //     });
    //     this.columns.forEach((col) => {
    //         if (col.filterable) {
    //             console.log(col.getDistinctValues());
    //         }
    //     });
    // }

    columnsToListOfRows() {
        return this.rows.map((row) => row.cells);
        // for (let i = 0; i < this.columns[0].cells.length; i++) {
        //     const row = this.columns.map((col) => col.cells[i]);
        //     data.push(row);
        // }
        // console.log(data);
        // return data;
    }

    filterData() {
        const rows = this.columnsToListOfRows();
        // const categoryFilters = state.columns.category.filters;
        // const tagFilters = state.columns.tags.filters;

        // if (categoryFilters.length + tagFilters.length === 0) {
        //     state.filteredRows = null;
        // }

        // state.filteredRows = [];
        // rows.forEach((row) => {
        //     const categoryMatch =
        //         categoryFilters.length ===
        //             state.columns.category.values.length ||
        //         categoryFilters.includes(row.category);
        //     const tagMatch =
        //         tagFilters.length === state.columns.tags.values.length ||
        //         tagFilters.some((a) => row.tags.includes(a));
        //     // console.log(categoryMatch, tagMatch, row.category, row.tags)
        //     if (categoryMatch && tagMatch) {
        //         state.filteredRows.push(row);
        //     }
        // });
        // state.filteredRows = rows;
    }

    validateConfig() {
        if (!this.config.key) {
            throw new Error(
                "please define a variable called key that has your Google API key"
            );
        }
        if (!this.config.sheetsId) {
            throw new Error(
                "please define a variable called sheetsId that has your Google sheets ID"
            );
        }

        if (!this.config.tabName) {
            throw new Error(
                "please define a variable called tabName that has the name of the tab (e.g., Sheet1)"
            );
        }
    }

    async fetchData() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetsId}/values/${config.tabName}?key=${config.key}`;

        const response = await fetch(url, {
            referrer: "https://vanwars.github.io/google-sheets/",
        });
        const data = await response.json();
        console.log(data);
        // state.rows = processData(data);
        const rows = data.values;
        rows.shift();

        this.initColumnsAndRows(rows);

        // this.setColumnData(rows);
        this.renderTable();
    }

    renderTable() {
        console.log("Rendering table!!!");
        // filterData();
        this.sortByColumn();

        // build rows:
        const tableRows = this.rows.map((row) => row.getTableRow());

        // build header row:
        const headerRow = `<tr>
            ${this.columns
                .map((col) => col.getHeaderCell(config.sortColumn))
                .join("\n")}
        </tr>`;

        // add table:
        document.body.innerHTML = `
            <table>
                <thead>${headerRow}</thead>
                <tbody>${tableRows.join("")}</tbody>
            </table>
        `;
        this.attachEventHandlers();
    }

    attachEventHandlers() {
        document.querySelectorAll("a.sort").forEach(
            ((a) => {
                // console.log(a);
                a.onclick = this.sortTable.bind(this);
            }).bind(this)
        );
        document.querySelectorAll(".fa-filter").forEach(
            ((a) => {
                // console.log(a);
                a.onclick = this.showFilterBox.bind(this);
            }).bind(this)
        );
    }

    sortTable(ev) {
        document.querySelector("table").remove();

        const elem = ev.currentTarget;
        config.sortColumn = elem.getAttribute("data-key");
        const col = this.columnMap[config.sortColumn];
        this.renderTable();

        if (col.sortDirection === "asc") {
            col.sortDirection = "desc";
        } else {
            col.sortDirection = "asc";
        }
        ev.preventDefault();
    }

    sortByColumn() {
        const key = config.sortColumn;
        const col = this.columnMap[key];
        const multiplier = col.sortDirection === "desc" ? -1 : 1;
        const stringSorter = (a, b) => {
            return a[col.ordering].localeCompare(b[col.ordering]) * multiplier;
        };

        // convert to array of arrays to sort:
        const data = this.columnsToListOfRows();
        data.sort(stringSorter);

        // convert back to rows:
        this.rows = data.map((rec) => new Row(rec, this.columns));
    }

    showFilterBox(ev) {
        const elem = ev.currentTarget;
        const key = elem.getAttribute("data-key");
        const col = this.columnMap[key];
        let div = document.getElementById(`filter-${key}`);
        if (div) {
            this.hideFilterMenus();
        } else {
            this.hideFilterMenus();
            this.renderFilterBox(col);
        }
        ev.preventDefault();
        ev.stopPropagation();
    }

    renderFilterBox(col) {
        console.log(`#th-${col.id}`);
        let cbList = [];
        const values = col.getDistinctValues(this.rows);
        values.forEach((option) => {
            cbList.push(`<input type="checkbox" value="${option}"
                ${col.activeFilters.includes(option) ? "checked" : ""}>
                ${option}<br>`);
        });
        const ratio = col.activeFilters.length / values.length;
        const batchOption = ratio > 0.5 ? "deselect" : "select";
        const batchButton = `<a id="filter-${col.id}-${batchOption}" href="#">
            ${batchOption} all</a>`;
        const div = `
            <div class="box" id="filter-${col.id}" data-key="${col.id}">
                    ${batchButton}<br><br>
                    ${cbList.join("")}
            </div>`;
        document.body.insertAdjacentHTML("beforeend", div);
        // set the position:
        this.updateFilterBoxPosition(col);

        // add event handlers:
        // document.querySelectorAll(`#filter-${col.id} input`).forEach((cb) => {
        //     cb.onclick = updateFilterAndRedraw;
        // });
        document.getElementById(`filter-${col.id}`).onclick = (ev) => {
            ev.stopPropagation();
        };

        // const handleBatchFilterUpdate = (ev) => {
        //     const elem = ev.currentTarget;
        //     const flag = elem.innerHTML.indexOf("deselect") >= 0 ? false : true;
        //     document.querySelectorAll(`#filter-${id} input`).forEach((cb) => {
        //         cb.checked = flag;
        //     });
        //     updateFilterAndRedraw(ev);
        //     ev.preventDefault();
        // };

        // if (batchOption === "deselect") {
        //     document.querySelector(`#filter-${id}-deselect`).onclick =
        //         handleBatchFilterUpdate;
        // } else {
        //     document.querySelector(`#filter-${id}-select`).onclick =
        //         handleBatchFilterUpdate;
        // }
    }

    hideFilterMenus() {
        document.querySelectorAll(`div[id^=filter-]`).forEach((div) => {
            div.remove();
        });
    }

    updateFilterBoxPosition(col) {
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
            const offsetX =
                (window.pageXOffset || document.documentElement.scrollLeft) -
                (document.documentElement.clientLeft || 0);
            div.style.left = `${x + offsetX}px`;
            div.style.top = `${y}px`;
            div.style.width = `${col.filterBoxWidth || w}px`;
        }
    }
}

const table = new Table(config);
