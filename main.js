import Column from "./column.js";
import config from "./config.js";
// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-
// Note: ensure that your Google Sheets "Share" setting is Public Read-only.

class Table {
    constructor(config) {
        this.config = config;
        const isValid = this.validateConfig();
        if (!isValid) {
            return;
        }
        this.initColumns();
        this.fetchData();
    }

    initColumns() {
        this.columns = config.columns.map((col, idx) => new Column(col, idx));
        this.columnMap = {};
        this.columns.forEach((col) => (this.columnMap[col.id] = col));
    }

    clearColumnData() {
        this.columns.forEach((col) => (col.cells = []));
    }

    columnsToListOfRows() {
        const data = [];
        for (let i = 0; i < this.columns[0].cells.length; i++) {
            const row = this.columns.map((col) => col.cells[i]);
            data.push(row);
        }
        console.log(data);
        return data;
    }

    validateConfig() {
        if (!this.config.key) {
            alert(
                "please define a variable called key that has your Google API key"
            );
            return false;
        }
        if (!this.config.sheetsId) {
            alert(
                "please define a variable called sheetsId that has your Google sheets ID"
            );
            return false;
        }

        if (!this.config.tabName) {
            alert(
                "please define a variable called tabName that has the name of the tab (e.g., Sheet1)"
            );
            return false;
        }
        return true;
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

        rows.forEach((row) => {
            this.columns.forEach((col, idx) => {
                col.cells.push(row[idx]);
            });
        });
        this.renderTable();
    }

    renderTable() {
        console.log("Rendering table!!!");
        // filterData();
        this.sortByColumn();

        // build rows:
        const tableRows = [];
        for (let i = 0; i < this.columns[0].cells.length; i++) {
            tableRows.push(`
                <tr>  
                ${this.columns.map((col) => col.getTableCell(i)).join("\n")}
                </tr>
            `);
        }
        // build header row:
        const headerRow = `<tr>
            ${this.columns.map((col) => col.getHeaderCell()).join("\n")}
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
        const listSorter = (a, b) => {
            let first = a[col.ordering];
            let second = b[col.ordering];
            // sort by first item (blanks always at the bottom)
            first = first.length > 0 ? first[0] : "";
            second = second.length > 0 ? second[0] : "";
            if (first === "") return 1 * multiplier;
            if (second === "") return -1 * multiplier;
            return first.localeCompare(second) * multiplier;
        };
        const rows = this.columnsToListOfRows();
        if (col.dataType === "list") {
            rows.sort(listSorter);
        } else {
            rows.sort(stringSorter);
        }

        this.clearColumnData();
        rows.forEach((row) => {
            this.columns.forEach((col, idx) => {
                col.cells.push(row[idx]);
            });
        });
    }
}

const table = new Table(config);
