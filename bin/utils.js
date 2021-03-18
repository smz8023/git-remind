#!/usr/bin/env node

const git = require('simple-git');
const inquirer = require('inquirer');

const styles = {
    green: ['\x1B[32m', '\x1B[39m'],
    red: ['\x1B[31m', '\x1B[39m'],
    yellow: ['\x1B[33m', '\x1B[39m'],
    redBG: ['\x1B[41m', '\x1B[49m'],
};

exports.log = (key, obj) => {
    if (typeof obj === 'string') {
        console.log(styles[key][0] + '%s' + styles[key][1], obj);
    } else {
        console.log(styles[key][0] + '%s' + styles[key][1], ...obj);
    }
};
exports.gitFn = {
    getRemotes() {
        return new Promise((resolve, reject) => {
            git().getRemotes(true, (e, r) => {
                if (e) {
                    reject();
                }
                resolve(r);
            });
        });
    },
    fetch() {
        return new Promise((resolve, reject) => {
            git().fetch((e, r) => {
                if (e) {
                    reject();
                }
                resolve(r);
            });
        });
    },
    getbranchmerged() {
        return new Promise((resolve, reject) => {
            git().branch(['--merged'], (err, res) => {
                if (err) reject();
                else resolve(res.all);
            });
        });
    },
    getCurrentBranch() {
        return new Promise((resolve, reject) => {
            git().status((err, res) => {
                if (err) reject();
                else resolve(res.current);
            });
        });
    },
    getCurrentBehind() {
        return new Promise((resolve, reject) => {
            git().status((err, res) => {
                if (err) reject();
                else resolve(res.behind);
            });
        });
    },
    mergeBranch(from, to) {
        return new Promise((resolve, reject) => {
            git().mergeFromTo(from, to, [], (err, res) => {
                if (err) reject();
                else resolve(res);
            });
        });
    },
    getbranchInfo(branch) {
        return new Promise((resolve, reject) => {
            git().branch(['-vv'], (err, res) => {
                if (err) reject();
                else {
                    if (res.branches[branch]) {
                        console.log('我在这里打印以下',res);
                        resolve(res.branches[branch]);
                    } else {
                        reject(res.branches[branch]);
                    }
                }
            });
        });
    },
};
exports.inquirer = {
    mainBranch(){
        return inquirer.prompt([
            {
                type: 'rawlist',
                name: 'main',
                message: '是否更新主干分支？',
                choices: ['Y', 'N'],
            },
        ]);
    },
    mergeMainBranch() {
        return inquirer.prompt([
            {
                type: 'rawlist',
                name: 'main',
                message: '是否合并主干分支？',
                choices: ['Y', 'N'],
            },
        ]);
    },
    currentMerge(currentBranch){
        return inquirer.prompt([
            {
                type: 'rawlist',
                name: 'main',
                message: `是否合并 ${currentBranch} 远程分支？`,
                choices: ['Y', 'N'],
            },
        ]);
    }

};

 


