export default class Base {
    constructor(opts, ordering) {
        console.log(opts, ordering);
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
        console.log(this);
    }

    getDistinctValues(rows) {
        const cells = rows.map((row) => row.cells[this.ordering]);
        // if we just want a distinct list:
        return [...new Set(cells)].sort();
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
            this.colWidth ? ` style="min-width:${this.colWidth};"` : ""
        }>
                ${colNameElement}
                ${colFilterElement}
            </th>`;
    }
}
