# PDF Compression Setup for Windows and Railway

This guide is only for this Laravel backend PDF compression feature. Local setup assumes you are using Windows. Deployment setup assumes the backend is hosted on Railway.

The app compresses only PDF uploads. It runs Ghostscript during the upload request, writes a temporary compressed PDF, uploads the smaller file to Supabase Storage, and falls back to the original file if compression fails.

Important: compression does not edit the original PDF on your computer. It only changes the copy uploaded to Supabase. Files that were uploaded before compression was working will also stay unchanged; upload the thesis PDF again after updating the env values if you want the stored/downloaded file to be smaller.

Compression is now used by these thesis upload paths:

- Student thesis upload: `/thesis`
- Admin thesis upload: `/admin/theses`
- Faculty thesis upload: `/faculty/theses`

## Quick Summary

- Local Windows command used by the app: `gswin64c.exe`, then `gswin32c.exe`, then `gs`.
- Railway command used by the app: `gs`.
- Compression is controlled by `.env` / Railway variables.
- Ghostscript must be installed separately on your Windows machine and in the Railway runtime image.
- No queue, worker, paid service, Docker requirement, or large PHP package is needed.

## Local Windows Setup

### Where to Run PowerShell Commands

You can run the PowerShell commands in either place:

- Windows PowerShell from the Start menu.
- VS Code integrated terminal, if the terminal profile is PowerShell.

For project commands like `php artisan config:clear`, `php artisan serve`, and `vendor\bin\phpunit`, run PowerShell from the backend folder:

```powershell
cd C:\Users\jcvis\OneDrive\Desktop\TAMS\backend
```

For Ghostscript checks like `gswin64c.exe --version`, you can run them from any folder because they only check whether Ghostscript is available on your Windows `PATH`.

Important: after adding Ghostscript to `PATH`, close and reopen PowerShell or the VS Code terminal before running `gswin64c.exe --version`.

### Install Ghostscript on Windows

1. Download Ghostscript from the official installer page:

```text
https://ghostscript.com/releases/gsdnld.html
```

2. Install the 64-bit Windows version.

3. Find the Ghostscript `bin` folder. It usually looks like this:

```powershell
C:\Program Files\gs\gs10.XX.X\bin
```

4. Add that folder to your Windows `PATH`:

- Press `Win + R`.
- Run `sysdm.cpl`.
- Open `Advanced` > `Environment Variables`.
- Under your user variables or system variables, edit `Path`.
- Add the Ghostscript `bin` folder.
- Open a new PowerShell window after saving.

5. Confirm Ghostscript is available:

```powershell
gswin64c.exe --version
```

If that fails, try:

```powershell
gs --version
```

At least one of those commands must work locally.

## Backend Env Values

Add these to `backend\.env`:

```env
PDF_COMPRESSION_ENABLED=true
PDF_COMPRESSION_PRESET=screen
PDF_COMPRESSION_FORCE_DOWNSAMPLE=true
PDF_COMPRESSION_IMAGE_DPI=72
PDF_COMPRESSION_GS_BINARY='C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe'
```

Preset choices:

| Preset | Use Case | Result |
| --- | --- | --- |
| `screen` | Strongest compression | Smallest file, lowest image quality |
| `ebook` | Recommended default | Balanced size and quality |
| `printer` | Higher quality | Larger file, less compression |

If your manual `compressed_forced.pdf` test gives the best savings and the quality is acceptable, set this locally and in Railway:

```env
PDF_COMPRESSION_PRESET=screen
PDF_COMPRESSION_FORCE_DOWNSAMPLE=true
PDF_COMPRESSION_IMAGE_DPI=72
```

Those three values make the Laravel upload use the same aggressive image-downsampling style as the manual `compressed_forced.pdf` command.

`PDF_COMPRESSION_GS_BINARY` is optional, but recommended on Windows. It tells Laravel the exact Ghostscript executable to use, so the web server does not depend on Windows `PATH`.

After editing `backend\.env`, clear cached Laravel config:

```powershell
php artisan config:clear
```

If you use config cache locally:

```powershell
php artisan config:cache
```

## Local Windows Compression Test

Put a sample PDF in `backend`, or adjust the paths below.

PowerShell one-line command:

```powershell
gswin64c.exe -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -dQUIET -sOutputFile=compressed.pdf original.pdf
```

If your system exposes `gs` instead:

```powershell
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -dQUIET -sOutputFile=compressed.pdf original.pdf
```

Compare sizes:

```powershell
Get-Item original.pdf, compressed.pdf | Select-Object Name, Length
```

If the default `/ebook` command does not shrink your sample enough, test the more aggressive `/screen` preset with forced 72 DPI image downsampling:

```powershell
& "C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe" "-sDEVICE=pdfwrite" "-dCompatibilityLevel=1.4" "-dPDFSETTINGS=/screen" "-dColorImageResolution=72" "-dGrayImageResolution=72" "-dMonoImageResolution=72" "-dDownsampleColorImages=true" "-dDownsampleGrayImages=true" "-dDownsampleMonoImages=true" "-dNOPAUSE" "-dBATCH" "-sOutputFile=compressed_forced.pdf" "original.pdf"
```

Then compare all three files:

```powershell
Get-Item original.pdf, compressed.pdf, compressed_forced.pdf | Select-Object Name, Length
```

Use this result as a quality check. The forced `/screen` command can reduce scanned or image-heavy PDFs much more, but text and embedded images may look softer.

Expected result:

- Scanned or image-heavy PDFs usually shrink.
- Text-only PDFs may shrink only a little, or may not shrink at all.
- If the compressed PDF is larger than the original, the Laravel upload code discards it and uploads the original.

## Local Laravel Upload Test

1. Confirm Supabase values are present in `backend\.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=thesis-files
```

2. Confirm compression is enabled:

```env
PDF_COMPRESSION_ENABLED=true
PDF_COMPRESSION_PRESET=screen
PDF_COMPRESSION_FORCE_DOWNSAMPLE=true
PDF_COMPRESSION_IMAGE_DPI=72
PDF_COMPRESSION_GS_BINARY='C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe'
```

3. Clear config:

```powershell
php artisan config:clear
```

4. Start the backend:

```powershell
php artisan serve
```

5. Upload a scanned or image-heavy thesis PDF through the normal app flow.

6. Check the database `file_size` value. When compression succeeds, it should reflect the compressed file size, not the original file size.

7. Check the Laravel log:

```powershell
Get-Content storage\logs\laravel.log -Tail 50
```

Look for `PDF compression starting`, `PDF compression succeeded`, and `Supabase upload completed`. If you see `PDF compression skipped`, the log reason explains why the original file was uploaded instead.

Use the exact `path` from `Supabase upload completed` when checking Supabase Storage. The filename can look similar across uploads because it keeps the original PDF name, but every upload gets a new UUID in the path.

Example successful log:

```text
local.INFO: Supabase upload completed. {"path":"faculty-theses/manuscripts/2026/05/uuid-original.pdf","upload_size":5816815,"original_size":13121539,"used_compressed_file":true}
```

In Supabase, check that exact `path`. The size should match `upload_size`, not `original_size`.

If the latest lines say `testing.INFO`, those lines came from PHPUnit tests, not from a real upload. A real local upload should normally say `local.INFO`. Clear the old log before testing to avoid confusion:

```powershell
Clear-Content storage\logs\laravel.log
```

Then restart Laravel and upload the thesis PDF again:

```powershell
php artisan config:clear
php artisan serve
```

## Automated Tests on Windows

Run the focused test:

```powershell
vendor\bin\phpunit --filter ThesisUploadCompressionTest
```

These tests fake both Supabase and the Ghostscript process branch, so they do not require Ghostscript to be installed.

Note: this Laravel install may not expose `php artisan test`, so use `vendor\bin\phpunit`.

## Railway Deployment

Your Windows Ghostscript installation is only for local development. Railway builds and runs your app inside a Linux container, so you must also install Ghostscript in the Railway runtime.

### 1. Confirm the Railway Backend Root

This repo has the Laravel backend inside `backend`.

In Railway, your backend service should either:

- Use `backend` as the service root directory, or
- Be deployed from the backend folder with the Railway CLI.

If Railway builds from the repository root by mistake, it may detect the wrong app or miss `composer.json`.

### 2. Add Railway Variables

Open Railway:

```text
Project > backend service > Variables
```

Add these variables:

```env
PDF_COMPRESSION_ENABLED=true
PDF_COMPRESSION_PRESET=screen
PDF_COMPRESSION_FORCE_DOWNSAMPLE=true
PDF_COMPRESSION_IMAGE_DPI=72
RAILPACK_DEPLOY_APT_PACKAGES=ghostscript
```

Do not set `PDF_COMPRESSION_GS_BINARY` on Railway unless you know the exact Linux path. Railway should use `gs` from the installed `ghostscript` package.

Why `RAILPACK_DEPLOY_APT_PACKAGES` matters:

- Railway uses Railpack for zero-config builds.
- Ghostscript is needed at runtime, when the user uploads a PDF.
- `RAILPACK_DEPLOY_APT_PACKAGES=ghostscript` tells Railpack to install the `ghostscript` Apt package into the deployed runtime image.

You can also set the variables with the Railway CLI:

```powershell
railway variables set PDF_COMPRESSION_ENABLED=true PDF_COMPRESSION_PRESET=screen PDF_COMPRESSION_FORCE_DOWNSAMPLE=true PDF_COMPRESSION_IMAGE_DPI=72 RAILPACK_DEPLOY_APT_PACKAGES=ghostscript
```

If Railway asks which service to target, choose the backend service.

### 3. Redeploy Railway

After changing Railway variables, redeploy the backend service.

From the Railway dashboard:

```text
backend service > Deployments > Redeploy
```

Or with the CLI:

```powershell
railway redeploy
```

If you deploy from the CLI and want to deploy only the backend folder:

```powershell
railway up backend --path-as-root
```

### 4. Confirm Ghostscript in Railway

During the next Railway build/deploy, check the deployment logs for Apt package installation. You want to see `ghostscript` installed successfully.

Then upload a scanned or image-heavy PDF through the deployed app.

Success signs:

- Upload completes normally.
- Laravel logs show `PDF compression succeeded`.
- The stored database `file_size` is smaller than the original local PDF size.
- Supabase storage usage grows by the compressed size, not the original size.

### 5. If Railway Still Skips Compression

Check Railway deployment logs and Laravel logs.

Common causes:

- `RAILPACK_DEPLOY_APT_PACKAGES=ghostscript` was added but the service was not redeployed.
- The variable was added to the wrong Railway service.
- The backend service root directory is not `backend`.
- `PDF_COMPRESSION_ENABLED=false` is set in Railway.
- Railway is still set to `PDF_COMPRESSION_PRESET=ebook` instead of `screen`.
- `PDF_COMPRESSION_FORCE_DOWNSAMPLE=true` is missing.
- The uploaded file is not detected as `application/pdf`.
- Ghostscript produced a larger file, so the app uploaded the original by design.

### 6. If Railway Uses Nixpacks Instead of Railpack

Some older Railway deployments may still show Nixpacks in build logs. If your logs say Nixpacks, use this variable instead:

```env
NIXPACKS_APT_PKGS=ghostscript
```

Keep these too:

```env
PDF_COMPRESSION_ENABLED=true
PDF_COMPRESSION_PRESET=screen
PDF_COMPRESSION_FORCE_DOWNSAMPLE=true
PDF_COMPRESSION_IMAGE_DPI=72
```

Redeploy after changing the variables.

## Railway Resource Notes

- Compression happens during the upload request, so very large scanned PDFs can add upload latency.
- The code currently uses a 20-second Ghostscript timeout.
- The existing upload limit is 50 MB.
- Use `screen` plus forced 72 DPI downsampling if you need the same result as `compressed_forced.pdf`.
- Set `PDF_COMPRESSION_ENABLED=false` if Railway CPU usage or upload latency becomes a problem.

## Troubleshooting

### `gswin64c.exe` is not recognized on Windows

- Reopen PowerShell after changing `PATH`.
- Confirm the Ghostscript `bin` folder exists.
- Run the command with the full path:

```powershell
& "C:\Program Files\gs\gs10.XX.X\bin\gswin64c.exe" --version
```

### Local uploads work but Railway uploads are not compressed

- Your Windows install does not affect Railway.
- Add `RAILPACK_DEPLOY_APT_PACKAGES=ghostscript`.
- Redeploy the Railway backend service.
- Check Railway logs for Ghostscript package installation.

### No Laravel log appears after uploading

- Confirm the frontend is using the local backend: `frontend\.env` should contain `VITE_API_URL=http://localhost:8000`.
- Restart the frontend dev server after changing `frontend\.env`.
- Confirm Laravel is running from the backend folder: `cd C:\Users\jcvis\OneDrive\Desktop\TAMS\backend`, then `php artisan serve`.
- Upload a new PDF after clearing the log; old uploads will not generate new compression logs.
- If you are using the deployed Railway URL, check Railway logs instead of local `storage\logs\laravel.log`.
- If the log remains empty, open the browser dev tools Network tab and confirm the upload request goes to `/thesis`, `/admin/theses`, or `/faculty/theses` on `localhost:8000`.

### Uploads fail

- Temporarily set `PDF_COMPRESSION_ENABLED=false`.
- Redeploy or clear local config.
- Try the upload again.
- If upload works with compression disabled, the issue is Ghostscript availability or process execution.

### Compression succeeds but the file is not smaller

That is normal for some PDFs. The app only uploads the compressed file when it is smaller. Otherwise, it uploads the original to avoid wasting storage with a larger result.

## References

- Ghostscript Windows downloads: https://ghostscript.com/releases/gsdnld.html
- Railway variables: https://docs.railway.com/variables
- Railway CLI deploys: https://docs.railway.com/cli/deploying
- Railpack Apt packages: https://railpack.com/guides/installing-packages/
