# Linux - Commands, Shell Scripting and Administration
Servers, containers, cloud machines and most developer tools run on Linux. This notebook takes you from "what is a terminal" to file systems, permissions, processes, networking, systemd, shell scripting, performance troubleshooting and interview scenarios.
## What is Linux
- **Linux** is a free, open-source operating system kernel (Linus Torvalds, 1991). A **distribution** = kernel + tools + package manager: Ubuntu/Debian (apt), RHEL/CentOS/Rocky/Fedora/Amazon Linux (dnf/yum), Alpine (apk, tiny, used in containers), Arch.
- The **kernel** manages CPU scheduling, memory, devices, file systems and networking. User programs talk to it through **system calls**.
@layers Applications (nginx, python, git) | Shell (bash, zsh) + utilities | System calls | Linux kernel: processes, memory, file systems, drivers, network | Hardware :: Linux architecture
- The **shell** (bash, zsh) reads commands, runs programs and scripts. The **terminal** is the window that shows it.
## File System Hierarchy
@tree /(bin,etc,home(asha),var(log),tmp,usr(bin,lib),proc,dev,opt) :: Everything starts at / (root)
| Directory | Contains |
|---|---|
| /bin, /usr/bin | user commands (ls, cp, python3) |
| /sbin, /usr/sbin | admin commands |
| /etc | configuration files (passwd, hosts, nginx/) |
| /home/user | user files; ~ is your home |
| /root | root user's home |
| /var | variable data: logs (/var/log), databases, mail |
| /tmp | temporary files (cleared on reboot) |
| /opt | optional third-party software |
| /proc, /sys | virtual files exposing kernel and process info |
| /dev | device files (/dev/sda, /dev/null) |
| /mnt, /media | mount points |
- "Everything is a file": devices, sockets, pipes and process info appear as files.
## Navigation and File Commands
```sh
pwd                          # where am I
ls -lah                      # long list, hidden files, human sizes
cd /var/log; cd ~; cd -; cd ..
mkdir -p projects/app/src    # create nested folders
touch notes.txt              # create empty file / update timestamp
cp file.txt backup.txt; cp -r src/ src_copy/
mv old.txt new.txt           # move or rename
rm file.txt; rm -r folder/   # delete (no recycle bin! careful with rm -rf)
ln -s /opt/app/current app   # symbolic link (shortcut); ln without -s = hard link
tree -L 2                    # folder tree
file image.png; stat notes.txt
```
## Viewing and Editing Files
```sh
cat file.txt; less big.log (q to quit, / to search); head -n 20 f; tail -n 50 f
tail -f /var/log/nginx/access.log      # follow live
wc -l file.txt                         # count lines
nano file.txt                          # easy editor
vim file.txt                           # i = insert, Esc, :wq = save+quit, :q! = quit without saving, /word = search, dd = delete line
diff a.txt b.txt
```
## Searching and Text Processing
```sh
find / -name "*.conf" 2>/dev/null           # by name
find . -type f -size +100M                  # big files
find . -mtime -1 -name "*.log"              # modified in last day
find . -name "*.tmp" -delete
grep -rn "ERROR" /var/log/app/              # recursive with line numbers
grep -i -v "debug" app.log                  # case-insensitive, invert match
grep -E "5[0-9]{2} " access.log | wc -l     # regex: count 5xx responses
cut -d',' -f1,3 data.csv                    # columns 1 and 3
sort data.txt | uniq -c | sort -nr | head   # frequency count
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -5     # top 5 IPs
awk -F',' '$3 > 50000 {print $1, $3}' salaries.csv
sed -i 's/localhost/db.internal/g' config.ini        # in-place replace
tr 'a-z' 'A-Z' < in.txt; xargs; tee out.txt
```
### Pipes and redirection
@chain cat access.log -> grep 500 -> awk print $1 -> sort -> uniq -c -> sort -nr -> head :: A pipeline: output of one command feeds the next
| Symbol | Meaning |
|---|---|
| cmd > file | write stdout to file (overwrite) |
| cmd >> file | append |
| cmd 2> err.log | redirect stderr (fd 2) |
| cmd > out 2>&1 | both stdout and stderr to out |
| cmd < file | read stdin from file |
| a pipe b | stdout of a becomes stdin of b |
| cmd1 && cmd2 | run cmd2 only if cmd1 succeeded |
| cmd1 ; cmd2 | run both |
| cmd & | run in background |
| $(cmd) | command substitution |
## Users, Groups and Permissions
- Every file has an **owner**, a **group**, and permissions for **u**ser, **g**roup, **o**thers: **r**ead (4), **w**rite (2), e**x**ecute (1).
@cells - r w x r - x r - - :: -rwxr-xr-- = 754: owner rwx (7), group r-x (5), others r-- (4)
| Number | Permission |
|---|---|
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |
| 0 | --- |
```sh
ls -l script.sh
chmod 755 script.sh          # rwxr-xr-x
chmod u+x deploy.sh; chmod -R g+w shared/
chmod 600 ~/.ssh/id_ed25519  # private keys must be owner-only
chown asha:devs report.txt; chown -R www-data:www-data /var/www
sudo useradd -m -s /bin/bash ravi; sudo passwd ravi
sudo usermod -aG docker ravi  # add to a group
id ravi; groups; whoami; su - ravi; sudo -i
cat /etc/passwd /etc/group    # user and group lists (/etc/shadow holds password hashes)
umask 022                     # default permissions for new files
```
- Directories: r = list, w = create/delete inside, x = enter. Special bits: **setuid** (run as owner, e.g. passwd), **setgid**, **sticky bit** on /tmp (only owners can delete their files). ACLs (`setfacl`) for finer control.
- `sudo` runs one command as root; configure in /etc/sudoers with `visudo`. Principle of least privilege: do not work as root.
## Processes and Jobs
- A **process** = running program with a PID, owner, state, memory. Parent/child tree starts from **PID 1** (systemd).
```sh
ps aux | grep nginx          # all processes
ps -ef --forest              # tree
top / htop                   # live CPU and memory
pgrep -a python; pidof nginx
kill 1234                    # SIGTERM (15): ask nicely to stop
kill -9 1234                 # SIGKILL: force (cannot be caught - last resort)
kill -HUP 1234               # SIGHUP: many daemons reload config
pkill -f "gunicorn app"
sleep 100 &                  # background job
jobs; fg %1; bg %1; Ctrl+Z (suspend); Ctrl+C (SIGINT)
nohup python3 worker.py > worker.log 2>&1 &     # survive logout
nice -n 10 ./batch.sh; renice -n 5 -p 1234      # priority
lsof -p 1234; lsof -i :8080                     # open files / who uses port 8080
```
- States: R (running), S (sleeping), D (uninterruptible I/O wait), Z (zombie: finished but parent has not collected the exit status), T (stopped).
## Package Management
```sh
sudo apt update && sudo apt upgrade -y          # Debian/Ubuntu
sudo apt install -y nginx git curl
apt search redis; apt remove nginx
sudo dnf install -y httpd                       # RHEL/Fedora/Amazon Linux
apk add --no-cache curl                         # Alpine
snap install code --classic
```
## Services with systemd
```sh
sudo systemctl start nginx; sudo systemctl stop nginx; sudo systemctl restart nginx
sudo systemctl enable --now nginx               # start now and on every boot
systemctl status nginx
journalctl -u nginx -f                          # service logs (follow)
journalctl --since "1 hour ago" -p err
systemctl list-units --type=service --state=failed
```
```txt
# /etc/systemd/system/myapp.service
[Unit]
Description=My FastAPI app
After=network.target
[Service]
User=app
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
Environment=ENV=prod
[Install]
WantedBy=multi-user.target
```
```sh
sudo systemctl daemon-reload && sudo systemctl enable --now myapp
```
## Disk and Storage
```sh
df -h                        # free space per file system
du -sh /var/log/* | sort -h  # what is using space
lsblk; sudo fdisk -l         # disks and partitions
sudo mkfs.ext4 /dev/xvdf; sudo mount /dev/xvdf /data      # format and mount a new volume
echo '/dev/xvdf /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab   # mount at boot
free -h                      # RAM and swap
tar -czvf backup.tar.gz project/; tar -xzvf backup.tar.gz
zip -r site.zip site/; unzip site.zip
rsync -avz --delete src/ user@server:/backup/src/        # efficient sync
```
- **Inode** = metadata record for a file (owner, size, permissions, block pointers); the file name lives in the directory. Disk can be "full" because inodes ran out (`df -i`).
- File systems: ext4, XFS, Btrfs; LVM for resizable volumes; RAID for redundancy.
## Networking Commands
```sh
ip a                          # IP addresses (old: ifconfig)
ip route                      # routing table
ping -c 4 google.com          # reachability (ICMP)
traceroute google.com         # path hops (or mtr)
dig example.com A +short; nslookup example.com   # DNS lookup
curl -I https://example.com   # HTTP headers
curl -X POST -H "Content-Type: application/json" -d '{"a":1}' http://localhost:8000/api
wget https://example.com/file.zip
ss -tulpn                     # listening ports and processes (old: netstat -tulpn)
nc -zv db.internal 5432       # is a TCP port open?
sudo tcpdump -i eth0 port 443 -c 20     # capture packets
cat /etc/hosts /etc/resolv.conf
sudo ufw allow 22/tcp; sudo ufw enable  # firewall (Ubuntu); iptables / nftables / firewalld
hostnamectl; uname -a
```
## SSH and Remote Work
```sh
ssh-keygen -t ed25519
ssh-copy-id user@server
ssh user@server -i ~/.ssh/key.pem
scp file.txt user@server:/tmp/; scp -r user@server:/var/log/app ./logs
ssh -L 5432:localhost:5432 user@bastion     # local port forward (tunnel to a private DB)
```
```txt
# ~/.ssh/config
Host prod
    HostName 13.233.10.5
    User ubuntu
    IdentityFile ~/.ssh/prod.pem
```
- Harden SSH: disable password login and root login in /etc/ssh/sshd_config (`PasswordAuthentication no`, `PermitRootLogin no`), use keys, fail2ban, change nothing without keeping a second session open.
## Environment Variables and Shell Configuration
```sh
echo $HOME $PATH $USER
export API_URL=https://api.example.com      # for this shell and its children
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
env | grep API; printenv PATH
alias ll='ls -lah'
which python3; type ls
history | grep docker; !!; !42; Ctrl+R (search history)
```
## Shell Scripting (bash)
```sh
#!/usr/bin/env bash
set -euo pipefail                  # exit on error, undefined variable, failed pipe
NAME="${1:-world}"                 # first argument with a default
echo "Hello, $NAME"
COUNT=$(ls | wc -l)
if [[ $COUNT -gt 10 ]]; then echo "many files"; elif [[ $COUNT -eq 0 ]]; then echo "empty"; else echo "few"; fi
if [[ -f config.yml ]]; then echo "config exists"; fi          # -d dir, -e exists, -z empty string
for f in *.log; do gzip "$f"; done
for i in {1..5}; do echo "$i"; done
while read -r line; do echo "LINE: $line"; done < input.txt
backup() {                         # function
    local src=$1 dest=$2
    tar -czf "$dest/backup-$(date +%F).tar.gz" "$src" && echo "done"
}
backup /var/www /backups
case "$1" in
    start) echo "starting";;
    stop)  echo "stopping";;
    *)     echo "usage: $0 {start|stop}"; exit 1;;
esac
ARR=(a b c); echo "${ARR[1]} ${#ARR[@]}"
echo "exit code of last command: $?"
trap 'echo "cleaning up"; rm -f /tmp/lock' EXIT
```
| Variable | Meaning |
|---|---|
| $0 | script name |
| $1 .. $9 | arguments |
| $# | number of arguments |
| $@ | all arguments |
| $? | exit status of last command (0 = success) |
| $$ | current PID |
### Script: disk usage alert
```sh
#!/usr/bin/env bash
set -euo pipefail
THRESHOLD=80
df -h --output=pcent,target | tail -n +2 | while read -r pct mount; do
    used=${pct%\%}
    if (( used > THRESHOLD )); then
        echo "$(date): $mount is ${used}% full" | tee -a /var/log/disk_alert.log
    fi
done
```
### Script: log analyser
```sh
#!/usr/bin/env bash
LOG=${1:-/var/log/nginx/access.log}
echo "Total requests: $(wc -l < "$LOG")"
echo "Top 5 IPs:"; awk '{print $1}' "$LOG" | sort | uniq -c | sort -nr | head -5
echo "Status codes:"; awk '{print $9}' "$LOG" | sort | uniq -c | sort -nr
echo "Top URLs with 5xx:"; awk '$9 ~ /^5/ {print $7}' "$LOG" | sort | uniq -c | sort -nr | head
```
## Scheduling with cron
```sh
crontab -e
# m  h  dom mon dow  command
  0  2  *   *   *    /opt/scripts/backup.sh >> /var/log/backup.log 2>&1     # every day at 02:00
  */5 * *   *   *    /opt/scripts/health_check.sh                          # every 5 minutes
  0  9  *   *   1-5  /opt/scripts/report.sh                                # 9 AM on weekdays
crontab -l
```
## Logs
- System logs: `journalctl`, /var/log/syslog (Ubuntu) or /var/log/messages (RHEL), /var/log/auth.log (logins, sudo), application logs in /var/log/<app>. `dmesg` = kernel ring buffer (hardware, OOM killer).
- logrotate compresses and rotates logs so disks do not fill.
## Performance Troubleshooting
| Symptom | Commands |
|---|---|
| high CPU | top / htop (sort by CPU), pidstat, perf top |
| memory | free -h, top (RES), vmstat 1, dmesg (OOM killer) |
| disk I/O | iostat -xz 1, iotop |
| disk full | df -h, du -sh, df -i, lsof +L1 (deleted but open files) |
| network | ss -s, iftop, sar -n DEV 1, ping, traceroute |
| load average | uptime (1, 5, 15 min; compare with number of CPUs: nproc) |
@flow (Server is slow) | uptime + top: CPU high? | free -h: swapping? | iostat: disk busy? | ss / ping: network? | (check app logs + recent deploys) :: Troubleshooting order (USE method: Utilisation, Saturation, Errors)
## Linux Internals for Interviews
- **Boot**: firmware (BIOS/UEFI) -> bootloader (GRUB) -> kernel + initramfs -> systemd (PID 1) -> targets/services -> login.
- **Kernel space vs user space**: user programs run with restricted privileges and switch to kernel mode via system calls (open, read, write, fork, exec, mmap).
- **fork + exec**: fork copies the process (copy-on-write), exec replaces it with a new program - how the shell runs commands.
- **Signals**: SIGINT (Ctrl+C), SIGTERM (polite stop), SIGKILL (force), SIGHUP (reload), SIGCHLD (child exited).
- **Hard link vs soft link**: hard link = another name for the same inode (survives deleting the original, same file system only); soft link = a path pointer (breaks if target is deleted, works across file systems and for directories).
- **Containers** use Linux **namespaces** (isolate PID, network, mount, user) + **cgroups** (limit CPU/memory) - see notebook 16.
## Linux Interview Questions
Q: How do you find which process is using port 8080?
A: `sudo ss -tulpn | grep 8080` or `sudo lsof -i :8080`, then inspect or stop the PID.
Q: The disk is 100% full on a server. What do you do?
A: `df -h` to find the file system, `du -sh /* | sort -h` to drill down, clear old logs/rotate them, check `lsof +L1` for deleted files still held open (restart that process), check `df -i` for inode exhaustion, then add monitoring and logrotate.
Q: A service will not start. How do you debug?
A: `systemctl status svc`, `journalctl -u svc -n 100`, check config syntax, permissions, ports in use, environment variables, and run the ExecStart command manually.
Q: Explain chmod 644 and 755.
A: 644 = owner read/write, group and others read (normal files). 755 = owner full, others read/execute (scripts and directories).
Q: Difference between kill and kill -9?
A: kill sends SIGTERM allowing graceful cleanup; kill -9 sends SIGKILL which the process cannot catch - use only when SIGTERM fails.
Q: What is a zombie process and an orphan process?
A: A zombie has exited but its parent has not read its exit status (wait); an orphan's parent died and it is adopted by PID 1.
Q: What does load average mean?
A: Average number of processes running or waiting (CPU or uninterruptible I/O) over 1, 5 and 15 minutes; compare with CPU cores.
Q: How do you find files larger than 1 GB?
A: `find / -type f -size +1G -exec ls -lh {} \; 2>/dev/null`.
Q: How do you count unique IPs in a log file?
A: `awk '{print $1}' access.log | sort -u | wc -l`.
Q: What happens when you type ls and press Enter?
A: The shell parses the line, finds ls via PATH, forks a child, the child execs /usr/bin/ls which makes system calls (getdents, write) to list the directory, the parent waits and prints the prompt.
Q: Soft link vs hard link?
A: Hard link points to the same inode; soft link stores a path and can dangle.
Q: How do you schedule a job every Monday at 6 AM?
A: Cron entry `0 6 * * 1 /path/script.sh`.
Q: How do you see the last 100 lines of a log and keep following it?
A: `tail -n 100 -f app.log`.
Q: How do you check open ports on a remote server?
A: `nc -zv host port` for one port or `nmap host` (with permission).
Q: What is swap?
A: Disk space used as overflow memory; heavy swapping means RAM is exhausted and the system becomes slow.
