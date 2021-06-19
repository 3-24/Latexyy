/*
MIT License

Copyright (c) 2019 Joseph Rautenbach

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const fs = require('fs');
const fsPromises = fs.promises;
const shell = require('shelljs');

const tempDir = 'temp';
const outputDir = 'output';


// Unsupported commands we will error on
const unsupportedCommands = ['\\usepackage', '\\input', '\\include', '\\write18', '\\immediate', '\\verbatiminput', '\\begin{math}', '\\end{math}'];

// Get the LaTeX document template for the requested equation
function getLatexTemplate(equation) {
    return `
      \\documentclass[preview, convert={convertexe={convert -flatten}, outext=.png, density=300}, border=2pt]{standalone}
      \\usepackage{amsmath}
      \\usepackage{amssymb}
      \\usepackage{amsfonts}
      \\usepackage{xcolor}
      \\usepackage{siunitx}
      \\usepackage[utf8]{inputenc}
      \\begin{document}
      \\begin{math}
      ${equation}
      \\end{math}
      \\end{document}`;
}

function generateID() {
    // Generate a random 16-char hexadecimal ID
    let output = '';
    for (let i = 0; i < 16; i++) {
        output += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
    }
    return output;
}

  // Get the final command responsible for launching the Docker container and generating a svg file
function getCommand(id) {
    // Commands to run within the container
    return `
      cd ${tempDir}/${id}
      # Prevent LaTeX from reading/writing files in parent directories
      echo 'openout_any = p\nopenin_any = p' > /tmp/texmf.cnf
      export TEXMFCNF='/tmp:'
      timeout 5 pdflatex -shell-escape -interaction=nonstopmode -halt-on-error equation.tex
      cp equation.png ../../${outputDir}/img-${id}.png
      `;
}

  // Execute a shell command
function execAsync(cmd, opts = {}) {
    return new Promise((resolve, reject) => {
      shell.exec(cmd, opts, (code, stdout, stderr) => {
        if (code != 0) reject(new Error(stderr));
        else resolve(stdout);
      });
    });
}

// Deletes temporary files created during a conversion request
function cleanupTempFilesAsync(id) {
    return fsPromises.rmdir(`${tempDir}/${id}`, { recursive: true });
}

module.exports = async (math_string) => {
  // Create temp and output directories if they don't exist yet
  if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
  }
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
  }

  const unsupportedCommandsPresent = unsupportedCommands.filter(cmd => math_string.includes(cmd));
  if (unsupportedCommandsPresent.length > 0) await Promise.reject(new Error(`Unsupported command(s) found: ${unsupportedCommands.join(", ")}.`));


  const id = generateID();
  await fsPromises.mkdir(`${tempDir}/${id}`);
  await fsPromises.writeFile(`${tempDir}/${id}/equation.tex`, getLatexTemplate(math_string));

  await execAsync(getCommand(id));
  const outputFileName = `${outputDir}/img-${id}.png`;
  await cleanupTempFilesAsync(id);
  return outputFileName;
}