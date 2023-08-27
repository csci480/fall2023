export default class Column {
    static stringSorter(a, b) {
        const val1 = a.toLowerCase();
        const val2 = b.toLowerCase();
        return val1.localeCompare(val2);
    }
    constructor(opts, ordering) {
        if (!opts.id || !opts.name || ordering == null) {
            throw Error(
                "opts.id, opts.name, and order properties are required."
            );
        }
        this.ordering = ordering;
        this.dataType = "string";
        this.filterable = false;
        this.filters = [];
        this.activeFilters = [];
        this.sortable = true;
        this.colWidth = "150px";
        this.values = [];
        this.sortDirection = "asc";

        Object.assign(this, opts);
    }

    initFilters(rows) {
        // get a list of all the column values:
        let cells = [];
        if (this.dataType === "tags") {
            rows.forEach((row) => {
                // make each comma-separated element its own filter:
                const cellValues = row.cells[this.ordering]
                    .split(/[.,]/)
                    .map((cell) => cell.trim())
                    .filter((cell) => cell.length > 0);
                cells = cells.concat(cellValues);
            });
        } else {
            cells = rows.map((row) => row.cells[this.ordering]);
        }

        // keep only unique values:
        this.filters = [...new Set(cells)].sort(Column.stringSorter);
        this.activeFilters = [...this.filters];
    }

    getHeaderCell(sortId) {
        let colNameElement = `<span>${this.name}</span>`;
        let colFilterElement = "";

        if (this.sortable) {
            colNameElement = `<a href="#" data-key="${this.id}"
                class="sort ${this.sortDirection} ${
                sortId === this.id ? "active" : ""
            }" >
                    ${this.name}
                </a>`;
        }
        if (this.filterable) {
            let extraClasses = "";
            if (this.activeFilters.length != this.filters.length) {
                extraClasses = "active";
            }
            colFilterElement = `<i class="fa fa-filter ${extraClasses}" data-key="${this.id}"></i>`;
        }

        return `
            <th id="th-${this.id}" ${
            this.colWidth ? ` style="min-width:${this.colWidth}px;"` : ""
        }>
                ${colNameElement}
                ${colFilterElement}
            </th>`;
    }

    matchFilter(cellValue) {
        // if the cell value matches ANY of the
        // filter criteria, return true:
        return this.activeFilters
            .map((filter) => cellValue.includes(filter))
            .reduce((a, b) => a || b, false);
    }
}
