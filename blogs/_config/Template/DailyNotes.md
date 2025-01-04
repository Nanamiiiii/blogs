---
tags:
  - Daily
---

[[<% tp.date.now("YYYY-MM-DD", -7, tp.file.title, "YYYY-MM-DD") %>|◀◀]] | [[<% tp.date.now("YYYY-MM-DD", -1, tp.file.title, "YYYY-MM-DD") %>|◀]] | [[<% tp.date.now("YYYY-MM-DD", 1, tp.file.title, "YYYY-MM-DD") %>|▶]] | [[<% tp.date.now("YYYY-MM-DD", 7, tp.file.title, "YYYY-MM-DD") %>|▶▶]]

---

# Schedule

---

# Memo

---

# Diary

---
<%*
const thisDay = this.app.workspace.getActiveFile().basename;
const start = moment(thisDay).valueOf();
const end = moment(start).endOf('day').valueOf();

const isCreated = (file, start, end) => file.stat
	&& file.stat.ctime >= start
	&& file.stat.ctime <= end;
const isModified = (file, start, end) => file.stat
	&& file.stat.mtime >= start
	&& file.stat.mtime <= end;
const isUpdated = (file, start, end) =>
	isModified(file, start, end) && !isCreated(file, start, end);
const isPublicNote = (file) => !file.path.startsWith("_") && file.extension === "md";

const groupBy = (values, toKey) =>
    values.reduce(
        (prev, cur, _1, _2, k = toKey(cur)) => (
            (prev[k] || (prev[k] = [])).push(cur), prev
        ),
        {}
    );

const files = Object.values(this.app.vault.fileMap);

tR += "\n# Activities\n\n"

tR += "## Created"
const created = groupBy(
	files.filter(x => isCreated(x, start, end) && isPublicNote(x)),
	x => x.parent?.name,
);
Object.entries(created).map(([dir, files]) => {
	tR += `\n\n### ${dir}\n\n`
	tR += files.map(x => `- [[${x.basename}]]`).join("\n");
})

tR += "\n\n----\n\n"

tR += "\n## Updated"
const updated = groupBy(
	files.filter(x => isUpdated(x, start, end) && isPublicNote(x)),
	x => x.parent?.name,
);
Object.entries(updated).map(([dir, files]) => {
	tR += `\n\n### ${dir}\n\n`
	tR += files.map(x => `- [[${x.basename}]]`).join("\n");
})
%>

