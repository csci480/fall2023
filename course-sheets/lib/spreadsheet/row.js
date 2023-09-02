export default class Row {
    constructor(data, columns) {
        this.cells = data;
        this.columns = columns;
        this.isVisible = false;
        this.filterMatches = [];
    }

    getTableRow() {
        const tds = this.cells
            .map((cell, idx) => {
                const col = this.columns[idx];
                if (col.hidden) {
                    return "";
                }
                return this.getTableCell(col);
            })
            .join("\n");
        return `<tr>${tds}</tr>`;
    }

    getTableCell(col) {
        const idx = col.ordering;
        if (col.dataType === "url") {
            return `<td><a href="${this.cells[idx]}" target="_blank">${
                col.linkText ? col.linkText : "website"
            }</a></td>`;
        }
        return `<td>${this.cells[idx]}</td>`;
    }

    applyFilter() {
        // hard-coded for testing:
        // this.columns[1].activeFilters = [
        //     "Andrew Hair",
        //     "Mason Bradley",
        //     "Taylor Van Aken",
        // ];
        // this.columns[5].activeFilters = [
        //     "Medium-Term (in 3-5 years)",
        //     "After Graduation / Internship",
        // ];

        // tracks whether the cell value matches the filter
        // criteria for each column. If there are not filter
        // criteria specified, it returns true:
        const matchesByColumn = this.columns.map((col) => {
            const cellValue = this.cells[col.ordering];
            return col.matchFilter(cellValue);
        });
        // multiple criteria across multiple columns should be "and-ed".
        this.isVisible = matchesByColumn.reduce((a, b) => a && b, true);
    }
}
