" Obsidan vimrc

set clipboard=unnamed

imap jj <Esc>
imap <C-f> <Right>

exmap focusRight obcommand editor:focus-right
nmap <C-w>l :focusRight

exmap focusLeft obcommand editor:focus-left
nmap <C-w>h :focusLeft

exmap focusTop obcommand editor:focus-top
nmap <C-w>k :focusTop

exmap focusBottom obcommand editor:focus-bottom
nmap <C-w>j :focusBottom

exmap fzf obcommand obsidian-another-quick-switcher:search-command_landmark-search
nmap <C-s>f :fzf

