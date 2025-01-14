#!/usr/bin/env node

const { exec } = require('child_process');
const config = require('../package.json');
const { gitFn, log, inquirer } = require('./utils');
const { program } = require('commander');
program.version(config.version);

program.option('-b, --bin <command>')
 .option('-m, --main-branch <mainbranch>' )
 .option('-o, --branch-only <branch>'); 
program.parse(process.argv);

let mainBranch = 'master'; //默认为 master 分支
const maxBuffer = 100 * 1024 * 1024; //最大缓存 

if (program.mainBranch) mainBranch = program.mainBranch
else if (config.mainBranch) mainBranch = config.mainBranch;
let branchOnly = false
if(program.branchOnly === 'mainBranch' || program.branchOnly === 'currentBranch') branchOnly = program.branchOnly;

let num = 1;
async function main() {
    let isOk = true;
    const remotesList = await gitFn.getRemotes();
    if (!remotesList.length) {
        log('red', ['×', `  ${num++}.请先添加remotes!`]);
        isOk = false;
        return isOk;
    }
    const fetchContent = await gitFn.fetch();
    console.log('fetchContent',fetchContent);
    if (fetchContent.raw) {
        console.log(fetchContent.raw);
        log('green', ['√', `  ${num++}.fetch success!`]);
    } else {
        log('green', ['√', `  ${num++}.nothing to fetch`]);
    }
    
    const currentBranch = await gitFn.getCurrentBranch();
    if(!branchOnly || branchOnly ===  'mainBranch'){        
        await remindMainbranch();
    }   

    if (currentBranch !== mainBranch && (!branchOnly  || branchOnly ===  'currentBranch')) {
        const mergedList = await gitFn.getbranchmerged();
        const ismerged = mergedList.includes(mainBranch);
        if (ismerged) {
            log('green', [
                '√',
                `  ${num++}.当前分支${currentBranch}已经合并了主干分支${mainBranch}`,
            ]);
        } else {
            isOk = false;
            log('red', [`×   ${num++}.发现当前分支${currentBranch}没有合并主干${mainBranch}分支`]);
            const res = await inquirer.mergeMainBranch();
            if(res){
                let res = await gitFn
                .mergeBranch(mainBranch, currentBranch).then(res => {
                    log('green', ['√',`  ${num++}.当前分支${currentBranch}已经合并了主干分支${mainBranch}`]);
                    isOk = true;
                })
                .catch((err) => {
                    console.log('请先提交本地更改');
                });
                if (res && res.conflicts.length) {
                    log('red', [`${currentBranch}分支出现冲突，请先处理`]);
                    return;
                }
            }
        }
        const Behind = await gitFn.getCurrentBehind();
        if (Behind === 0) {
            log('green', ['√', `  ${num++}.当前分支${currentBranch}目前不需要更新`]);
        } else {
            isOk = false;
            log('red', [`×   ${num++}.当前分支${currentBranch}需要更新`]);
            let res = await inquirer.currentMerge(currentBranch);
            if(res){
                let res = await gitFn
                .mergeBranch(`remotes/origin/${currentBranch}`, currentBranch).then(res => {
                    log('green', ['√', `  ${num++}.当前分支${currentBranch}目前不需要更新`]);
                    isOk = true;
                })
                .catch((err) => {
                    console.log('请先提交本地更改!!!');
                });
                if (res && res.conflicts.length) {
                    log('red', [`${currentBranch}分支出现冲突，请先处理`]);
                    return;
                }
            }
                
        }
    }
    return isOk;
}

async function init() {
    let isOk = await main();
    if (isOk) log('green', ['√', '  验证通过 !!!']);
    if (isOk && program.bin) { 
        console.log('验证通过 开始编译');
        const childProces = exec(`${program.bin}`, {maxBuffer});
        childProces.stderr.pipe(process.stderr);
        childProces.stdout.pipe(process.stdout);
    } else if (!isOk) {
        log('red', '进程中断 请先上面解决问题');
    } 
}



async function  remindMainbranch() {
    const mainBranchInfo = await gitFn.getbranchInfo(mainBranch);
    const isBehind = mainBranchInfo.label.search(/behind(?= \d+\])/gi);
    const isAhead = mainBranchInfo.label.search(/ahead(?= \d+\])/gi);

    if (isBehind === -1 && isAhead === -1) {
        log('green', ['√', `  ${num++}.主干分支:${mainBranch}分支 为最新提交`]);
    }
    if (isBehind !== -1) {
        isOk = false;
        log('red', [`×   ${num++}.${mainBranch} 主干分支需要更新`]);
        let res = await inquirer.mainBranch();
        if (res.main === 'Y') {
            let res = await gitFn
                .mergeBranch(`remotes/origin/${mainBranch}`, mainBranch).then(res => {
                    isOk = true;
                    log('green', ['√', `  ${num++}.主干分支:${mainBranch}分支 为最新提交`]);
                })
                .catch((err) => {
                    console.log('请先提交本地更改');
                });
            if (res && res.conflicts.length) {
                log('red', ['主干分支出现冲突，请先处理']);
                return;
            }
        }
    }

    if (isAhead !== -1) {
        log('yellow', [`×   ${num++}.注意主干分支 ${mainBranch} 没有提交`]);
    }
}




init();
