# A tour of the basics: values, interpolation, arrays, hashes, methods, blocks.

name = "World"
puts "1. greeting: Hello, #{name}!"

count = 3
price = 2.5
puts "2. types: #{count.class} / #{price.class} / #{true.class} / #{nil.class}"

# Numbers are objects too, so unary minus binds to them directly.
puts "3. -7.abs = #{-7.abs}, 10.class = #{10.class}"

languages = ["Ruby", "Elixir", "Crystal"]
puts "4. array: #{languages.inspect} (size #{languages.size})"

scores = { "ruby" => 95, "go" => 80 }
scores["rust"] = 88
puts "5. best first: #{scores.sort_by { |_lang, score| -score }.map(&:first).join(", ")}"

def greet(who, greeting: "Hello")
  "#{greeting}, #{who}!"
end
puts "6. default keyword argument: #{greet("Ruby")}"
puts "7. overridden: #{greet("Ruby", greeting: "Hi")}"

total = [1, 2, 3, 4, 5].select(&:even?).map { |n| n * 10 }.sum
puts "8. even numbers times ten, summed: #{total}"

print "9. counting: "
3.times { |i| print "#{i} " }
puts

nothing = nil
puts "10. nil is falsy: #{!nothing}"
