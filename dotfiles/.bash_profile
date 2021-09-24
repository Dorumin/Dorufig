# Log the bash history for scrolling up when sessions die
PROMPT_COMMAND='history -a'

# UTF-8 copying
function copy {
    printf '%s' "$(</dev/stdin)" | cat > /dev/clipboard
}

export -f copy

## Overwrite default Windows one that doesn't handle unicode
alias clip="copy"

# 2 lazy
alias crun="cargo run --"

# Maybe I'll use Yarn 2 when I'm dead
# alias node="yarn node"

# Default starting directory to Code/
dir=$(pwd)
if [ "$dir" == "${HOME}" ]
then
	cd ~/Code
fi
