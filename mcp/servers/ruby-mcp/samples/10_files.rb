# Working with files and directories in a temporary sandbox.

require "tmpdir"
require "fileutils"
require "json"

Dir.mktmpdir("ruby-mcp-sample") do |dir|
  path = File.join(dir, "notes.txt")
  File.write(path, "first line\nsecond line\n")
  puts "1. exists: #{File.exist?(path)}, size: #{File.size(path)} bytes"
  puts "2. read: #{File.read(path).inspect}"
  puts "3. readlines: #{File.readlines(path, chomp: true).inspect}"

  File.open(path, "a") { |f| f.puts "third line" }
  puts "4. after append: #{File.readlines(path).length} lines"

  File.foreach(path).with_index(1) do |line, n|
    puts "5. line #{n}: #{line.strip}" if n <= 2
  end

  json_path = File.join(dir, "data.json")
  File.write(json_path, JSON.pretty_generate({ "files" => Dir.children(dir).sort }))
  puts "6. json written on disk parses back: #{JSON.parse(File.read(json_path))["files"].inspect}"

  sub = File.join(dir, "sub")
  Dir.mkdir(sub)
  Dir.glob(File.join(dir, "*.txt")).each { |f| FileUtils.cp(f, sub) }
  puts "7. copied into sub: #{Dir.children(sub).inspect}"
  puts "8. basename and extname: #{File.basename(path)} / #{File.extname(path)}"
  puts "9. dirname is the sandbox: #{File.dirname(path) == dir}"
end

puts "10. temp dir removed afterwards: #{Dir.glob(File.join(Dir.tmpdir, "ruby-mcp-sample*")).empty?}"
