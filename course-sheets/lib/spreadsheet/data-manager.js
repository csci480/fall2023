import Column from "./column.js";
import Row from "./row.js";

// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-
// Note: ensure that your Google Sheets "Share" setting is Public Read-only.

export default class DataManager {
    constructor(config) {
        this.config = config;
        this.columns = [];
        this.rows = [];
        this.columnMap = {};

        // throws error if not valid:
        this.validateConfig();
    }

    getColumnById(id) {
        return this.columnMap[id];
    }

    validateConfig() {
        const config = this.config;
        if (!config.key) {
            throw new Error(
                "please define a variable called key that has your Google API key"
            );
        }
        if (!config.sheetsId) {
            throw new Error(
                "please define a variable called sheetsId that has your Google sheets ID"
            );
        }

        if (!config.tabName) {
            throw new Error(
                "please define a variable called tabName that has the name of the tab (e.g., Sheet1)"
            );
        }
    }

    async fetchData() {
        const config = this.config;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetsId}/values/${config.tabName}?key=${config.key}`;

        const response = await fetch(url, {
            referrer: "https://vanwars.github.io/google-sheets/",
        });
        const data = await response.json();
        const rows = data.values;
        rows.shift();
        this.initColumnsAndRows(rows);
    }

    initColumns(data) {
        if (this.config.columns) {
            this.columns = this.config.columns.map(
                (col, idx) => new Column(col, idx)
            );
        } else {
            console.warn(
                "Configuration warning: Configure columns in config.js file"
            );
            this.columns = [];
            for (let i = 0; i < data[0].length; i++) {
                const opts = {
                    id: `col_${i + 1}`,
                    name: `Column ${i + 1}`,
                };
                this.columns.push(new Column(opts, i));
            }
        }
        this.columns.forEach(
            ((col) => {
                return (this.columnMap[col.id] = col);
            }).bind(this)
        );
    }

    initRows(data) {
        this.rows = [];
        data.forEach((rec) => {
            this.rows.push(new Row(rec, this.columns));
        });
    }

    initColumnsAndRows(data) {
        this.initColumns(data);
        this.initRows(data);
        this.columns.forEach(
            ((col) => {
                col.initFilters(this.rows);
            }).bind(this)
        );
    }

    clearColumnData() {
        this.columns.forEach((col) => (col.cells = []));
    }

    columnsToListOfRows() {
        return this.rows.map((row) => row.cells);
    }

    filterData() {
        this.rows.forEach((row) => {
            row.applyFilter();
        });
    }

    getFilteredRowsHTML() {
        this.filterData();
        return this.rows
            .filter((row) => row.isVisible)
            .map((row) => row.getTableRow());
    }

    sort(columnId) {
        let col = this.getColumnById(columnId);
        if (!col) {
            console.error(
                'Configuration error: "columnId" is not a valid column id.'
            );
            col = this.columns[0];
            columnId = col.id;
        }
        const multiplier = col.sortDirection === "desc" ? -1 : 1;
        const stringSorter = (a, b) => {
            const val1 = a[col.ordering].toLowerCase();
            const val2 = b[col.ordering].toLowerCase();
            return val1.localeCompare(val2) * multiplier;
        };

        // convert to array of arrays to sort:
        const data = this.columnsToListOfRows();
        data.sort(stringSorter);

        // convert back to rows:
        this.rows = data.map((rec) => new Row(rec, this.columns));
    }
}
