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
const sharp = require('sharp');
const { resolve } = require('path');

const staticDir = 'static';
const tempDir = 'temp';
const outputDir = 'output';


// Unsupported commands we will error on
const unsupportedCommands = ['\\usepackage', '\\input', '\\include', '\\write18', '\\immediate', '\\verbatiminput'];

// Get the LaTeX document template for the requested equation
function getLatexTemplate(equation) {
    return `
      \\documentclass[12pt]{article}
      \\usepackage{amsmath}
      \\usepackage{amssymb}
      \\usepackage{amsfonts}
      \\usepackage{xcolor}
      \\usepackage{siunitx}
      \\usepackage[utf8]{inputenc}
      \\thispagestyle{empty}
      \\begin{document}
      ${equation}
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
function getDockerCommand(id, output_scale) {
    // Commands to run within the container
    const containerCmds = `
      # Prevent LaTeX from reading/writing files in parent directories
      echo 'openout_any = p\nopenin_any = p' > /tmp/texmf.cnf
      export TEXMFCNF='/tmp:'
      # Compile .tex file to .dvi file. Timeout kills it after 5 seconds if held up
      timeout 5 latex -no-shell-escape -interaction=nonstopmode -halt-on-error equation.tex
      # Convert .dvi to .svg file. Timeout kills it after 5 seconds if held up
      timeout 5 dvisvgm --no-fonts --scale=${output_scale} --exact equation.dvi`;
  
    // Start the container in the appropriate directory and run commands within it.
    // Files in this directory will be accessible under /data within the container.
    return `
      cd ${tempDir}/${id}
      docker run --rm -i --user="$(id -u):$(id -g)" \
          --net=none -v "$PWD":/data "blang/latex:ubuntu" \
          /bin/bash -c "${containerCmds}"`;
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

module.exports = async (math_string, outputScale) => {
        // Create temp and output directories if they don't exist yet
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
    
        const id = generateID();
        await fsPromises.mkdir(`${tempDir}/${id}`);
        await fsPromises.writeFile(`${tempDir}/${id}/equation.tex`, getLatexTemplate(math_string));
    
        await execAsync(getDockerCommand(id, outputScale));
    
        const inputSvgFileName = `${tempDir}/${id}/equation.svg`;
        const outputFileName = `${outputDir}/img-${id}.png`;
        await sharp(inputSvgFileName, {density: 96}).flatten({ background: { r: 255, g: 255, b: 255 } }).toFile(outputFileName);
        await cleanupTempFilesAsync(id);
        return outputFileName;
}