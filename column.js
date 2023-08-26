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
        this.sortable = true;
        this.colWidth = "100px";
        this.values = [];
        this.filters = [];
        this.sortDirection = "asc";
        this.cells = [];

        Object.assign(this, opts);
        console.log(this);
    }

    getTableCell(idx) {
        if (this.dataType === "url") {
            return `<td><a href="${this.cells[idx]}" target="_blank">${
                this.linkText ? this.linkText : "website"
            }</a></td>`;
        }
        return `<td>${this.cells[idx]}</td>`;
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
