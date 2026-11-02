# String methods: searching, replacing, splitting, formatting.

text = "  Ruby is a dynamic, open source language.  "
puts "1. raw length #{text.length}, stripped length #{text.strip.length}"
puts "2. upcase/downcase: #{text.strip.upcase}, #{text.strip.downcase}"

words = "one,two,three".split(",")
puts "3. split: #{words.inspect} (joined back: #{words.join("-")})"

puts "4. sub replaces first match: #{"aaa".sub("a", "b")}"
puts "5. gsub replaces all: #{"aaa".gsub("a", "b")}"

puts "6. gsub with block: #{"abc".gsub(/[a-c]/) { |c| c.upcase }}"

puts "7. format with positional args: #{format("%s has %d items at %.2f each", "cart", 3, 4.5)}"
puts "8. sprintf shorthand: #{sprintf("%05.1f", 3.14159)}"

line = "  key = value  "
key, value = line.strip.split("=").map(&:strip)
puts "9. parsed: key=#{key.inspect} value=#{value.inspect}"

puts "10. chars: #{"hi".chars.inspect}, bytes of é: #{"é".bytes.inspect}"
puts "11. slice: #{"hello"[1, 3].inspect}, negative: #{"hello"[-2..].inspect}"

padded = "ruby".ljust(10, ".").rjust(12, ">")
puts "12. ljust then rjust: #{padded.inspect}"
