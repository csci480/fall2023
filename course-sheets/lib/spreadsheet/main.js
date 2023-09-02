import DataManager from "./data-manager.js";

export default class Table {
    constructor(config) {
        this.dm = new DataManager(config);
        this.sortColumn = config.sortColumn;

        window.onscroll = this.updateFilterBoxPosition.bind(this);

        // if filter box is visible, hide it:
        document.body.onclick = this.hideFilterMenus.bind(this);
    }

    async init() {
        await this.dm.fetchData();
        this.renderTable();
    }

    renderTable() {
        this.dm.sort(this.sortColumn);

        // get filtered rows:
        const tableRows = this.dm.getFilteredRowsHTML();

        // build header row:
        const headerRow = `<tr>
            ${this.dm.columns
                .filter((col) => !col.hidden)
                .map((col) => col.getHeaderCell(this.sortColumn))
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
                a.onclick = this.sortTable.bind(this);
            }).bind(this)
        );
        document.querySelectorAll(".fa-filter").forEach(
            ((a) => {
                a.onclick = this.showFilterBox.bind(this);
            }).bind(this)
        );
    }

    sortTable(ev) {
        document.querySelector("table").remove();

        const elem = ev.currentTarget;
        this.sortColumn = elem.getAttribute("data-key");
        const col = this.dm.getColumnById(this.sortColumn);
        this.renderTable();

        if (col.sortDirection === "asc") {
            col.sortDirection = "desc";
        } else {
            col.sortDirection = "asc";
        }
        ev.preventDefault();
    }

    showFilterBox(ev) {
        const elem = ev.currentTarget;
        const key = elem.getAttribute("data-key");
        const col = this.dm.getColumnById(key);
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
        let cbList = [];
        col.filters.forEach((option) => {
            cbList.push(`<input type="checkbox" value="${option}"
                ${col.activeFilters.includes(option) ? "checked" : ""}>
                ${option} (${col.filterMap[option]})<br>`);
        });
        const ratio = (col.activeFilters.length * 1.0) / col.filters.length;
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
        document.querySelectorAll(`#filter-${col.id} input`).forEach((cb) => {
            cb.onclick = this.updateFilterAndRedraw.bind(this);
        });
        document.getElementById(`filter-${col.id}`).onclick = (ev) => {
            ev.stopPropagation();
        };

        if (batchOption === "deselect") {
            document.querySelector(`#filter-${col.id}-deselect`).onclick =
                this.handleBatchFilterUpdate.bind(this);
        } else {
            document.querySelector(`#filter-${col.id}-select`).onclick =
                this.handleBatchFilterUpdate.bind(this);
        }
    }

    handleBatchFilterUpdate(ev) {
        const elem = ev.currentTarget;
        const id = elem.parentElement.id;

        const flag = elem.innerHTML.indexOf("deselect") >= 0 ? false : true;
        document.querySelectorAll(`#${id} input`).forEach((cb) => {
            cb.checked = flag;
        });
        this.updateFilterAndRedraw(ev);
        ev.preventDefault();
    }

    updateFilterAndRedraw(ev) {
        const elem = ev.currentTarget;
        const key = elem.parentElement.getAttribute("data-key");
        const id = elem.parentElement.id;
        const col = this.dm.getColumnById(key);
        col.activeFilters = [];
        document.querySelectorAll(`#${id} input`).forEach((cb) => {
            if (cb.checked) {
                col.activeFilters.push(cb.value);
            }
        });
        document.querySelector("table").remove();
        this.renderTable();

        // redraw filter box
        if (document.getElementById(id)) {
            document.getElementById(id).remove();
        }
        this.renderFilterBox(col);
        ev.stopPropagation();
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

            col = this.dm.getColumnById(id);
            div.style.left = `${x + offsetX}px`;
            div.style.top = `${y}px`;
            div.style.width = `${col.filterBoxWidth || w}px`;
        }
    }
}
