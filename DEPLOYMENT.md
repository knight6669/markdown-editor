# Knight Markdown Studio 发版手册

本文档记录将 Knight Markdown Studio 发布到 `https://knight-tech.cn/md/` 的标准流程。当前应用是纯前端 Vite 静态站点，线上目录为 `root@8.138.166.5:/var/www/html/md/`。

## 发布目标

- 访问地址：`https://knight-tech.cn/md/`
- 服务器连接：`ssh root@8.138.166.5`
- 应用目录：`/var/www/html/md/`
- 发布方式：本地构建 `dist`，上传到服务器临时目录，备份旧版本后替换静态文件。
- 约束：不修改 nginx 配置，不执行 nginx reload。

## 发版前检查

在本地项目根目录执行：

```bash
git status --short
npm run test
npm run lint
npm run build
```

构建完成后检查 `dist/index.html`，资源路径必须带 `/md/` 前缀：

```bash
grep -E '"/md/assets/|"/md/favicon' dist/index.html
```

如果看到 `src="/assets/...` 或 `href="/assets/...`，说明 Vite `base` 配置不正确，不能发布。

## 服务器检查

发布前可先确认服务器状态：

```bash
ssh root@8.138.166.5 "hostname; uname -sr; df -h /var/www/html; ls -ld /var/www/html /var/www/html/md"
```

推荐确认当前线上文件：

```bash
ssh root@8.138.166.5 "find /var/www/html/md -maxdepth 2 -type f | sort | sed -n '1,40p'"
```

## 发布步骤

以下命令以 PowerShell 为例，时间戳用于生成本次发布临时目录和备份目录：

```powershell
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$archive = "markdown-editor-$stamp.tar.gz"
$remoteTmp = "/tmp/markdown-editor-release-$stamp"
$backupDir = "/var/www/html/releases/md-$stamp"

tar -czf $archive -C dist .
ssh root@8.138.166.5 "mkdir -p '$remoteTmp' '/var/www/html/releases'"
scp $archive root@8.138.166.5:$remoteTmp/app.tar.gz
ssh root@8.138.166.5 "set -e; mkdir -p '$backupDir'; rsync -a --delete /var/www/html/md/ '$backupDir'/; rm -rf '$remoteTmp/app'; mkdir -p '$remoteTmp/app'; tar -xzf '$remoteTmp/app.tar.gz' -C '$remoteTmp/app'; find '$remoteTmp/app' -maxdepth 2 -type f | sort | sed -n '1,30p'; rsync -a --delete '$remoteTmp/app/' /var/www/html/md/; chown -R www-data:www-data /var/www/html/md; find /var/www/html/md -type d -exec chmod 755 {} +; find /var/www/html/md -type f -exec chmod 644 {} +; find /var/www/html/md -maxdepth 2 -type f | sort | sed -n '1,30p'"
Remove-Item $archive
```

注意：以上命令只替换 `/var/www/html/md/` 下的静态文件，不改 nginx。

验证通过后可清理服务器临时目录：

```bash
ssh root@8.138.166.5 "rm -rf /tmp/markdown-editor-release-YYYYMMDDHHMMSS"
```

## 发布后验证

在本地执行：

```bash
curl -I https://knight-tech.cn/md/
curl -s https://knight-tech.cn/md/ | grep '/md/assets/'
```

浏览器打开 `https://knight-tech.cn/md/`，重点检查：

- 页面能正常打开，没有 JS/CSS 404。
- Markdown 源码编辑、实时预览、滚动跟随正常。
- 工具栏展开/隐藏、主题切换、导入导出等核心能力可用。
- DevTools Network 中资源路径为 `/md/assets/...`。

## 回滚步骤

如果发布后发现问题，从最近一次备份恢复：

```bash
ssh root@8.138.166.5 "ls -dt /var/www/html/releases/md-* | head"
ssh root@8.138.166.5 "set -e; backup='/var/www/html/releases/md-YYYYMMDDHHMMSS'; test -d \"$backup\"; rsync -a --delete \"$backup/\" /var/www/html/md/; chown -R www-data:www-data /var/www/html/md"
```

将 `YYYYMMDDHHMMSS` 替换为实际备份目录时间戳。

## 常见问题

- 页面 HTML 能打开但样式或脚本 404：检查 `vite.config.ts` 是否设置 `base: '/md/'`，重新 `npm run build` 后再发布。
- 线上仍显示旧版本：检查浏览器缓存，并确认 `/var/www/html/md/index.html` 的资源 hash 是否已更新。
- 发布中断：不要直接删除备份目录，先确认 `/var/www/html/releases/md-*` 中是否存在可回滚版本。
- 权限异常：重新执行 `chown -R www-data:www-data /var/www/html/md`。
