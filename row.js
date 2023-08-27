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
        this.filterMatches = [];
        this.columns.forEach((col) => {
            const val = this.cells[col.ordering];
            col.activeFilters.forEach((filter) => {
                this.filterMatches.push(val.includes(filter));
            });
        });
        // if all of the matches are true of if there are
        // no active filters, then display the row:
        this.isVisible = this.filterMatches.reduce((a, b) => a && b, true);
        console.log(this.filterMatches, hidden);
    }
}
