---
title: "不太熟悉Git？ 不妨看看这篇文章"
description: "Git是目前世界上最先进的分布式版本控制系统，由C语言进行开发"
date: 2023-07-06
tags: ["分布式", "Git", "职场"]
---
# 不太熟悉Git？ 不妨看看这篇文章

# 前言

Git是目前世界上最先进的分布式版本控制系统，由C语言进行开发  
在2022年之前，Linux构建的方式是世界各地的志愿者把源代码文件通过diff的方式发送给Linus，然后由Linus本人通过手工方式合并代码  
Linus痛恨的CVS和SVN都是集中式的版本控制系统，而Git是分布式的版本控制系统，这两者有何区别？  
集中式：版本库是集中存放在中央服务器的，开发的时候用的都是开发机（本地机器），所以要先从中央服务器获取最新的版本，然后进行开发之后将代码推送给中央服务器。最大的问题是必须联网才能够进行工作，在网速慢的时候，提交大文件就会非常耗时。  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678188593863-d6bf276c-e9c4-4234-b6d7-e16968ed6cfd.png)  
分布式：分布式控制版本是没有“中央服务器”这个概念的，每个人的电脑上都是一个完整的版本库，这样在开发的时候就不需要联网，因为版本库在自己的电脑上。既然每个人的电脑上都有一个完整的版本库，那多个人如何协作呢？这时候就需要将各自对文件的修改推送给对方，就可以互相看到对方的修改了。和集中式版本控制系统相比，分布式版本控制的安全性会高很多。因为每个人的电脑里都有完整的版本库，某个人的版本库出问题了没有关系，而集中式版本控制只有一个版本库。通常分布式版本控制系统也有一台充当“中央服务器”的电脑，当然这个服务器的作用只是方便“交换修改”，没有它也一样能够干活，只是交换修改不方便。  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678188584432-dc182e29-d84f-4688-a76f-3929c3cca103.png)

  

## Git与svn的区别

  

  1. 历史记录：Git更加轻量级，每次提交只记录变化，而SVN每次提交都会存储完整的文件
  2. 版本管理：Git更加灵活，允许分支和分支合并，而SVN只有主干
  3. 安全性：Git分布式存储，一个服务器挂掉不会影响其他服务器，而SVN单一服务器容易出现安全问题
  4. 开发流程：Git的开发流程更加快捷，可以快速的实现拉取、提交，而SVN开发流程繁琐
  5. 部署：Git无需安全客户端，支持跨平台，而SVN必须安装客户端才能使用
  6. 使用：Git更加简单，学习成本更低，而SVN略显复杂

  

# 基本操作

  

## 创建版本库

  

版本库：仓库repository，可以简单理解为一个目录，这个目录中的所有文件都可以被Git管理起来，每个文件的修改、删除，Git都能够进行跟踪，以便任何时刻都可以追踪历史，或者在将来某个时刻可以“还原”。  
创建一个版本库很简单

  

//1.创建目录  
mkdir learngit  
cd learngit  
pwd

  

//2.通过git init将这个目录变成Git可以管理的仓库  
执行完git init命令之后，当前目录会多出一个.git目录  
这个目录是git用来跟踪版本库的，默认是一个隐藏文件

  

![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678189503006-bc98e449-741d-4d91-aa4e-d3bd44b16c7e.png)

  

//3. 将文件放到Git仓库中  
vim readme.txt //随便写点什么  
git add readme.txt //将readme.txt文件添加到仓库  
git commit -m "this is a readme.txt"  
为什么add和commit要分成两步呢？因为一次commit可以提交很多文件，而可以多次add不同的文件

  

## 状态查看

  

现在我们将readme.txt文件修改为如下内容  
Git is a distributed version control system.  
Git is free software.  
可以通过git status 来查看结果  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678355009272-e23f67a2-6786-48f0-875a-19d05cf142ee.png)  
git status 告诉我们readme.txt文件已经被修改了，但是还没有准备提交的修改  
怎么查看到底该了什么内容呢？  
可以通过git diff命令来查看difference，显示的格式正是Unix通用的Diff格式  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678355110807-dded9caf-6434-4b70-b075-fe320739e177.png)  
通过git add readme.txt进行提交   
再通过git status查看当前状态  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678355154657-a3d7b2f4-3cd0-4945-bebe-0712d6778eec.png)  
这是告诉我们，被提交的修改有readme.txt文件  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678355198020-84903437-637d-42a5-8b9b-200b726d1263.png)

  

  * 如果想要查看工作区的状态，使用Git status命令
  * 如果git status告诉你有文件被修改过，用git diff可以查看修改内容

  

## 回退

  

我们再次修改readme文件

  

以下是新内容  
Git is a distributed version control system. Git is free software distributed under the GPL.

  

之后尝试提交  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678357097632-685b79bc-822f-4de3-b57d-e09f290ab521.png)  
像这样，不断对文件进行修改，然后不断提交修改到版本库里，就类似于把git的状态存盘，每当文件修改到一定程度的时候，就可以『保存一个快照』，这个快找在Git中被称为`commit`，一旦把文件弄乱了或者误删了文件，可以从最近的一个`commmit`中恢复  
`git log`能够帮助我们看到git的历史记录  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678358775248-6bf272d1-e6ad-4d54-a21b-f989b54b260b.png)  
显示的是从最近到最远的提交日志，如果嫌输出信息太多，可以加上`--pretty=online`参数  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678358866180-3d52804d-67ef-4b7a-8974-5dfcb38707b4.png)  
在Git中，用`HEAD`来表示当前版本，上一个版本为`HEAD^`，上上一个版本为`HEAD^^`，  
我们可以通过`git reset --hard HEAD^`来将文件回退到上一个版本  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678359124893-39bffb95-79cf-4113-9f3b-e283680c9e6d.png)  
在底层，Git在内部有一个指向当前版本的`HEAD`指针，当进行回退版本的时候，GIT仅仅是将HEAD的指向进行了改变  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678359218961-7e93f482-4afe-4fcc-b1c8-9355d7175fbe.png)  
一个新的问题：如果这个时候我又想回到GPL的那个版本该怎么办呢？  
可以看到这时候我们通过Git log进行日志查看，已经没有那个版本的记录了  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678359276193-18e60b0b-0e01-4a3d-8714-c382cb90ebb2.png)  
我们可以通过git reflog 看到之前提交的id  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678359377392-74d9630d-49ef-4980-8907-0a95f1fdcd16.png)  
通过git reset --hard参数+ID 进行回退

  

## 工作区与暂存区

  

Git与其他版本控制系统的一个不同之处就是有暂存区的概念  
**工作区**  
就是电脑里能够看到的目录，比如learngit文件夹  
**版本库**  
工作区有一个隐藏目录.git，这个不算是工作区，而是Git的版本库。Git的版本库里面有很多东西，其中最重要的就是称为stage(index)的暂存区，还有Git为我们自动创建的第一个分支master，以及指向master的一个指针叫做HEAD  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678367802548-19e6a3d6-f6da-4b62-aca6-666c67b31424.png)  
我们将文件往Git版本库添加的时候，是分两步执行的

  

  * git add把文件添加进去，实际上就是把文件添加到暂存区
  * git commit提交更改，实际上就是把文件去的所有内容提交到当前分支

  

因为在创建GIT版本库的时候，GIT自动为我们创建了唯一一个分支master，所以git commit就是往master分支上提交更改  
git commit之后  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678368125642-644fe14f-c105-4e91-a5b9-b734ac91d3ce.png)

  

## 管理修改

  

每一次的修改都必须使用git add添加之后，才会放到暂存区，在git commit的时候才会提交到分支。如果修改了之后没有使用git add命令，那么是不会提交到分支中的

  

## 撤销修改

  

当我们将文件修改成以下内容，但是未提交的时候，git会进行以下提示  
Git is free software distributed under the GPL. Git has a mutable index called stage. Git tracks changes of files. My stupid boss still prefers SVN.  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678368632729-27bba334-30ca-4562-b6e9-0f72da0dfd48.png)  
可以使用git checkout -- readme.txt 进行把readme.txt文件的工作区的修改全部撤销  
切记，一定要添加--标签，不然这个命令会变成切换到另一个分支  
这里的撤销有两种情况

  

  * readme.txt自修改之后还没有被放到缓存区中，现在，撤销修改就回到和版本库一模一样的状态
  * readme.txt已经添加到暂存区之后，又做了修改，撤回修改就回到添加到暂存区之后的状态

  

当然 现在推荐的命令是 git restore readme.txt  
当已经把修改通过`git add`命令添加到暂存区之后，想要丢弃修改，分成两步

  

  * git reset HEAD 
  * git checkout --file

  

## 删除文件

  

当我们在工作区下添加一个文件  
vim test.txt  
内容如下：  
hello world.  
然后通过git add test.txt 与 git commit -m "add test.txt"进行提交  
这个时候我们把test.txt文件进行删除  
再通过git status查看会发现

  

![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678422258602-10415288-7baf-4457-89c5-37524150238d.png)  
现在我们有两种选择  
1.确定删除 使用git rm test.txt，然后git commit -m "remove test.txt"  
2.删错了 使用版本库里的版本替换工作区的版本 git checkout -- test.txt  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678422406340-cba604e1-4a81-40cb-b868-27c342bbf546.png)

  

# 远程仓库

  

添加远程仓库  
`git remote add origin git@xxx`  
git push //将本地库的内容推送到远程库上  
-u 参数不但能够实现远程推送 还能够将本地分支与远端分支关联起来 之后的推送或者拉取就能够简化命令  
`git remote -v`  
查看远程仓库信息  
`git remote rm origin`  
删除远程仓库（解除本地和远程的绑定关系）  
`git clone`克隆远端代码 ssh协议的速度>https

  

# 分支管理

  

HEAD是一个指针，指向的分支就是当前分支，在一开始的时候，master分支是一条线，Git使用master指向最新的提交，再用HEAD指向master，就能确定当前分支以及提交点  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678427493208-6d377fc1-a6fa-46eb-976a-db0fc41addf4.png)  
每次提交，master分支都会向前移动一步，这样随着不断提交，master分支的线也会越来越长  
当我们创建了一个新的分支，其实也就是一个新的指针dev，指向的是master相同的提交，再把HEAD指向dev，表示当前分支在dev上  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678427641087-f976c198-cd6f-4120-befa-d2e0f3960edf.png)  
因为git的新建分支是创建一个指针以及修改HEAD的指向，而文件本身内容不变，所以速度很快  
从现在开始，对工作区的修改和提交就是针对dev分支了，新提交之后dev指针向前移动，但是master指针不变  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678427815218-dc8c92b0-33b6-4c04-b93b-29af8b1cd165.png)

  

## 分支管理

  

git branch dev 创建dev分支  
git checkout dev 切换到dev分支  
添加一个内容为hello world的test文件  
git add + git commit 提交成果  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678429753496-bc2ffbca-e971-496e-91b7-0a4ab10572eb.png)  
git checkout master 切换回主分支  
git merge dev 将dev分支合并到当前分支  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678430172603-49b4e561-b0bc-4da9-a07d-60e56ef9588f.png)  
然后再通过git branch -d dev将dev分支进行删除  
git推荐现在的分支操作使用switch命令  
`git switch -c` 创建并切换到新分支  
`git switch master` 创建到已有分支

  

## 冲突

  

git使用<<<<<<<，=======，>>>>>>>标记出不同分支的内容标记出不同的分支  
更改冲突文件为想要的内容后提交

  

## 分支管理

  

在合并分支的时候，如果可能，git会使用`fast forward`模式，在这种模式下，删除分支之后就会丢掉分支信息  
合并分支的时候，加上--no-ff参数就可以使用普通模式合并，合并后的历史有分支，能够看出来曾经做过合并  
`git merge --no-ff "merge dev" dev`  
![](https://chengxisheng777-1307885216.cos.ap-beijing.myqcloud.com/img/1_1678439958569-e68169af-7db8-4190-a0c6-1e294dca0d5f.png)

  

## 

  

## bug

  

一般每个bug都会新建一个分支来修改，修复之后合并分支，然后将临时分支删除  
git stash 将当前工作区进行存储  
一是用git stash apply恢复，但是恢复后，stash内容并不删除，你需要用git stash drop来删除；  
另一种方式是用git stash pop，恢复的同时把stash内容也删了：

  

因此，多人协作的工作模式通常是这样：

  

  1. 首先，可以试图用git push origin 推送自己的修改；
  2. 如果推送失败，则因为远程分支比你的本地更新，需要先用git pull试图合并；
  3. 如果合并有冲突，则解决冲突，并在本地提交；
  4. 没有冲突或者解决掉冲突后，再用git push origin 推送就能成功！

  

如果git pull提示no tracking information，则说明本地分支和远程分支的链接关系没有创建，用命令git branch --set-upstream-to origin/。  
这就是多人协作的工作模式，一旦熟悉了，就非常简单。

  

## 标签

  

git tag 给commit打标签  
git show 查看标签信息  
git tag -a 查看所有标签  
git tag -d 删除标签  
git push origin 推送本地标签

  

## github

  

1.fork一个仓库 然后clone仓库 因为没权限clone原仓库  
2.开发 往自己的仓库推送  
3.推送pr给原仓库

  

# Git进阶操作

  

### git pull

  

### 拉取成功但不更更新

  

这个因为本地有更改，和仓库对应不上，解决方式如下  
1.git stash将本地修改存储起来  
2.git pull //建议使用完整的git pull origin branchname

  

### git pull内部执行原理

  

pull包含两个操作，fetch和merge  
fetch: 将远程仓库拉取到本地仓库  
merge:将本地仓库和分支进行merge  
git pull的时候会向远端发送git-upload-pack请求，携带的是本地仓库commit的记录，如果一致则不需要拉取，不一样就将远端仓库拉下来

  

### push之前pull的原因

  

git commit的时候，仓库并不会将本地和远程仓库代码进行比较，不会识别出代码是否存在冲突，必须进行pull命令之后，才会将本地代码和远程仓库的代码进行比较，如果二者的代码存在冲突，必须要解决冲突后重新commit push，如果不存在冲突，则pull的时候直接合并代码，不会将本地代码覆盖掉

  

### git status中的untracked file

  

在Git中，未被跟踪的文件（untracked file）是指存在与Git管理的目录中，但是尚未被添加到Git版本控制中的文件。这些文件没有被Git追踪，因此它们不受Git版本控制的管理。  
当使用`git status`命令查看git存储库的状态，一般日志文件就会是untracked file，因为没必要对日志进行追踪，日志也不会提交到代码库中  
如果想把未被追踪的文件添加到Git版本控制中，可以使用git add命令将它们添加到Git的暂存区中，然后使用git commit提交到存储库中

  

### git add提交了多余的文件，并且已经git commit了，怎么撤销

  

如果只是git add了，但是还没有git commit ，也就是说这些文件只是添加到了暂存区，还没有进行提交，那么可以通过git reset + filename，将文件从暂存区中删除，或者git reset直接将所有文件都从暂存区中撤销  
第一步得撤销git commit  
git revert sha值 撤销你的某一个提交  
或者直接 git revert HEAD 撤销最近一次提交，并创建一个新的提交来记录这个撤销操作，这个操作可以用来修复一个错误的提交或者撤销一个不必要的提交  
如果报错error:commit sha is a merge but no -m option was given  
这是因为正在尝试通过git revert命令撤销一个合并提交，但是没有指定用于撤销的父提交。要解决这个问题，需要使用-m选项来指定父提交，该选项后面需要指定一个数字，标识用于撤销提交的父提交的编号  
假设想撤销最近的一次合并提交，可以使用  
`git revert -m 1 HEAD`  
使用合并提交的第一个父提交来撤销该提交

  

### git commit错分支了怎么办

  

1.git log命令查找刚刚提交的SHA值  
2.git branch + git checkout 切换到你想提交的分支  
3.git cherry-pick + sha 讲提交应用到当前分支

  

### git revert后工作区代码消失

  

git reset --hard HEAD 该命令会将工作区和暂存区都重置为最新的提交，并清除所有未提交的修改。需要注意的是，这个命令会清除本地未提交的更改，因此在使用前请确认这些更改已经备份或者提交到了其他分支上。如果仍然无法恢复更改，可以使用git reflog命令查找之前的提交记录，使用git reset --hard +sha指向指定的提交

  

### 修改git commit提交信息

  

当我们cr被打回来的时候，就不需要重新git commit，而是直接git commit --amend修改之前的提交信息，这会被git认为是一次新的提交  
1.git commit --amend 打开编辑器  
2.修改提交信息  
3.git push

  

### 查看git信息

  

1.git log 查看所有的提交历史记录 例如提交ID 作者 日期 提交说明等等，常用于查看Git仓库的历史提交记录以及对比和合并分支  
2.git reflog 记录了Git仓库的每一次操作，包括分支和标签的创建、删除、移动等操作，这个命令可以用来找回已经删除的分支或者标签

  

### git diff

  

1.git diff --cached 查看暂存区和最后一次提交之间的差异 也就是git add离上一次的更改  
2.git diff filename 查看文件的更改  
3.git diff 查看已经修改但是未暂存（没有add）的更改

  

### 工作区、暂存区、本地仓库、远程仓库

  

1.工作区：实际写代码的地方，电脑上的文件夹，里面放着我们的代码文件  
2.暂存区：git提供的一个临时的存储取余，可以暂时存储我们修改过的文件，等待提交到本地仓库，对应的是某一个分支  
3.本地仓库：存储代码版本历史记录的地方，可以看作是Git维护的一个数据库，存储了项目的所有历史版本  
4.远程仓库：一个在网络上的Git仓库，通常由代码托管服务商提供，可以把本地仓库的代码推送到远程仓库中，也可以从远程仓库中拉取代码到本地仓库进行使用  
基本工作流：通过git add将文件添加到暂存区，然后通过git commit提交到本地仓库，最后通过git push提交到远程仓库  
为什么需要本地仓库：

  

  * 安全性：本地仓库可以在本地保存代码的历史版本，即使在远程仓库数据丢失或者被破坏的情况下，本地仓库中的代码仍然是安全的
  * 离线操作：没有网络的情况下，本地仓库允许开发人员继续对代码进行修改和提交
  * 提高效率：由于本地仓库不需要每次从远程仓库拉取代码，可以大大减少代码拉取的时间和网络带宽

  

### git工作区修改后切换到新分支，保存修改

  

如果在工作区有未提交的修改，并且切换到新分支，那么这些修改是不会被保存的，因为一个暂存区对应的是一个分支  
这个时候我们就需要  
1.git stash //将工作区的修改保存到一个临时区  
2.git checkout  
3.git stash pop 或者git stash apply  
4.如果有冲突的话，处理对应的文件

  

[code]
    <<<<<<< HEAD
    // 这里是当前分支的修改内容
    =======
    // 这里是合并分支的修改内容
    >>>>>>> merge-branch
[/code]

  

二者区别  
apply从stash中恢复最近的一次修改，但不会将这些修改移出  
pop从stash中恢复最近的一次修改，同时将修改弹出

  

### git merge和git rebase的区别

  

merge 是合并的意思  
rebase 是复位基底的意思  
推荐是使用git rebase 因为rebase的代码历史非常清晰

  

比如有一个master分支，同时6个人进行开发，需要创建六个单独的个人分支，然后使用merge的话就会有六个branch和主分支交织在一起，也就是master的commit历史是网状的.master是创建一个新的结点，然后将两个分支的历史联系在一起

  

而rebase会把提交移动到master的最前面，形成一条线

## 结语

本文泛谈`Git`的历史变动，各种基础以及高级操作和相关命令，以及他们的原理，相信大家能够有所收获。

创作不易，如果有收获欢迎**点赞、评论、收藏** ，您的支持就是我最大的动力。
