// https://docs.google.com/spreadsheets/d/1M6lIxSbYaTI3lTkPvDbd-Ex4P0EX-2R9oEvxKYbncEc/edit#gid=0
export default {
    key: "AIzaSyDsr4u1uupvnmDSfJdfgHZN2IWROiihlP8",
    sheetsId: "1jBqI1B4UzAEOhapZyZzpmAaF7wmP5oIU847nXpTwVQA",
    tabName: "Form Responses 1",
    sortColumn: "presenter",
    columns: [
        { id: "timestamp", name: "Timestamp", hidden: true },
        {
            id: "email",
            name: "Email",
            hidden: true,
            filterable: true,
            filterBoxWidth: 300,
        },
        {
            id: "presenter",
            name: "Presenter",
            colWidth: 200,
            filterable: true,
            filterBoxWidth: 200,
        },
        { id: "project_title", name: "Project Title" },
        { id: "strengths", name: "Strengths" },
        { id: "questions", name: "Questions" },
    ],
};
