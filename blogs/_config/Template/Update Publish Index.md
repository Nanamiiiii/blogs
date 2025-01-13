<%*
// Create Index
const index_filename = "_index";
if (!tp.file.find_tfile(index_filename)) {
	await tp.file.create_new("", index_filename);
	new Notice(`Created ${index_filename}.`);
}
const index_tfile = tp.file.find_tfile(index_filename);
const dv = app.plugins.plugins["dataview"].api;

// Collect file lists
const queries = [
	'TABLE WITHOUT ID file.link AS Note FROM "Footprints" WHERE publish SORT created desc LIMIT 10',
	'TABLE WITHOUT ID file.link AS Note, dateformat(updated, "yyyy/MM/dd HH:mm:ss") AS Modified WHERE publish AND !invisible AND file.name != "_index" SORT updated desc LIMIT 10',
	'TABLE WITHOUT ID file.link AS Note, dateformat(created, "yyyy/MM/dd HH:mm:ss") AS Added WHERE publish AND !invisible AND file.name != "_index" SORT created desc LIMIT 10',
];
const footprints_query = await dv.queryMarkdown(queries[0]);
const modified_query = await dv.queryMarkdown(queries[1]);
const created_query = await dv.queryMarkdown(queries[2]);

// Collect Tags
const collectFiles = (folder) => {
	let collectedFiles = [];
	if (!folder) {
		return [];
	}
	const children = folder.children;
	for (let i = 0; i < children.length; i++) {
		if (children[i] instanceof tp.obsidian.TFile) {
			if (children[i].extension !== "md") {
				continue;
			}
			collectedFiles.push(children[i]);
		} else if (children[i] instanceof tp.obsidian.TFolder) {
			if (children[i].name == "_config") continue;
			collectedFiles = collectedFiles.concat(collectFiles(children[i]));
		}
	}
	return collectedFiles;
}
const rootFolder = this.app.vault.getRoot();
const publishedFiles = collectFiles(rootFolder);
const cache = this.app.metadataCache;
const tagsFilename = "Tags";
let collectedTags = [];
for (let i = 0; i < publishedFiles.length; i++) {
	const fileCache = cache.getFileCache(publishedFiles[i]);
	const frontmatter = fileCache?.frontmatter;
	if (!tp.obsidian.parseFrontMatterEntry(frontmatter, "publish")) {
		continue;
	}
	collectedTags = collectedTags.concat(tp.obsidian.getAllTags(fileCache));
}
collectedTags = Array.from(new Set(collectedTags));
const tagsFileContent = collectedTags.join(" ");

try {
	await app.vault.modify(index_tfile, "---\n");
	await app.vault.append(index_tfile, "title: Home\n");
	await app.vault.append(index_tfile, "tags: []\n");
	await app.vault.append(index_tfile, "publish: true\n");
	await app.vault.append(index_tfile, "description: 日々の戯れ言\n");
	await app.vault.append(index_tfile, "---\n");
	await app.vault.append(index_tfile, "> \"Garbage\" \"掃きだめ\" \"戯れ言\"  \n");
	await app.vault.append(index_tfile, "> ここにあるものは全て個人の意見・感想です  \n");
	await app.vault.append(index_tfile, "> ―― Myuu\n\n");
	//await app.vault.append(index_tfile, "# Tags\n");
	//await app.vault.append(index_tfile, tagsFileContent);
	//await app.vault.append(index_tfile, "\n\n");
	await app.vault.append(index_tfile, "# Footprints\n");
	await app.vault.append(index_tfile, `${footprints_query.value}`);
	await app.vault.append(index_tfile, "\n");
	await app.vault.append(index_tfile, "# Recently Modified\n");
	await app.vault.append(index_tfile, `${modified_query.value}`);
	await app.vault.append(index_tfile, "\n");
	await app.vault.append(index_tfile, "# Recently Created\n");
	await app.vault.append(index_tfile, `${created_query.value}`);
	await app.vault.append(index_tfile, "\n");
	new Notice(`Updated index.`);
} catch (error) {
	new Notice("⚠️ ERROR updating! Check console.", 0);
}
%>