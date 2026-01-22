import { execSync } from 'child_process';
import fs from 'fs';

try {
    // Get list of untracked files not ignored
    const filesOutput = execSync('git ls-files --others --exclude-standard').toString();
    const files = filesOutput.split('\n').filter(f => f.trim() !== '');

    if (files.length === 0) {
        console.log("No files to commit.");
        process.exit(0);
    }

    const numDays = 45;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    const chunks = Array.from({ length: numDays }, () => []);

    // Distribute files among the 45 chunks
    files.forEach((file, index) => {
        chunks[index % numDays].push(file);
    });

    for (let i = 0; i < numDays; i++) {
        const chunk = chunks[i];
        if (chunk.length === 0) continue;

        // Commit date: 45 days ago for i=0, up to today for i=44
        const daysAgo = numDays - 1 - i;
        const commitDate = new Date(now.getTime() - daysAgo * msPerDay);
        const dateStr = commitDate.toISOString();

        for (const file of chunk) {
            execSync(`git add "${file}"`);
        }

        const commitMessage = `Update ${chunk.length} files`;
        execSync(`git commit -m "${commitMessage}" --date="${dateStr}"`, {
            env: { ...process.env, GIT_AUTHOR_DATE: dateStr, GIT_COMMITTER_DATE: dateStr },
            stdio: 'inherit'
        });
        console.log(`Committed chunk ${i + 1}/${numDays} with ${chunk.length} files on ${dateStr}`);
    }

    execSync('git branch -M main');
    console.log("Branch renamed to main.");
} catch (error) {
    console.error("Error during execution:", error);
}
