# Regexp: matching, named captures, scanning, replacing.

log = "2024-05-01 12:00:01 INFO ready"
match = log.match(/(?<date>\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2} (?<level>[A-Z]+)/)
puts "1. named groups: date=#{match[:date]} level=#{match[:level]}"
puts "2. =~ returns the index: #{"abc123" =~ /\d+/}"
puts "3. captures: #{"ruby 3.3".match(/(\w+) (\d+\.\d+)/).captures.inspect}"
puts "4. scan: #{"a1 b2 c3".scan(/[a-z]\d/).inspect}"
puts "5. scan with groups: #{"a1 b2".scan(/([a-z])(\d)/).inspect}"
puts "6. gsub with a hash: #{"one two".gsub(/one|two/, "one" => "1", "two" => "2")}"
puts "7. gsub with block and $1/$2: #{"3 cats".gsub(/(\d+) (\w+)/) { "#{$2}: #{$1}" }}"
puts "8. Regexp.escape: #{Regexp.escape("a.b*c").inspect}"

verb = case "POST /users"
       when /\AGET/ then "get"
       when /\APOST/ then "post"
       else "other"
       end
puts "9. case/when with regexp: #{verb}"
puts "10. case-insensitive: #{("ABC" =~ /abc/i).inspect}, dot matches newline: #{("a\nb" =~ /a.b/m).inspect}"
puts "11. split on a regexp: #{"a1b22c".split(/\d+/).inspect}"
puts "12. regexp source and options: #{/abc/i.source.inspect} #{/abc/i.options}"
