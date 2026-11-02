# Array methods that cover most everyday work.

numbers = [5, 3, 8, 1, 9, 2, 8]
puts "1. input: #{numbers.inspect}"
puts "2. sorted: #{numbers.sort.inspect}, unique: #{numbers.uniq.inspect}"
puts "3. odds: #{numbers.select(&:odd?).inspect}, evens: #{numbers.reject(&:odd?).inspect}"
puts "4. doubled: #{numbers.map { |n| n * 2 }.inspect}"
puts "5. sum: #{numbers.sum}, product of first three: #{numbers.first(3).reduce(1, :*)}"
puts "6. min/max: #{numbers.min}/#{numbers.max}, minmax: #{numbers.minmax.inspect}"
puts "7. find first above 6: #{numbers.find { |n| n > 6 }}"

evens, odds = numbers.partition(&:even?)
puts "8. partition: evens=#{evens.inspect} odds=#{odds.inspect}"

pairs = [["a", 1], ["b", 2]]
puts "9. to_h from pairs: #{pairs.to_h.inspect}"
puts "10. zip: #{[1, 2, 3].zip(["x", "y"]).inspect}"

slices = [1, 2, 3, 4, 5, 6, 7].each_slice(3).to_a
puts "11. each_slice(3): #{slices.inspect}"

chunks = [1, 1, 2, 3, 3, 3].chunk_while { |a, b| a == b }.to_a
puts "12. chunk_while runs: #{chunks.inspect}"

nested = [[1, [2, 3]], [4]]
puts "13. flatten: #{nested.flatten.inspect}, compact: #{[1, nil, 2].compact.inspect}"
puts "14. rotating: #{[1, 2, 3].rotate.inspect}, reversing: #{[1, 2, 3].reverse.inspect}"

stack = []
stack.push(1).push(2)
popped = stack.pop
puts "15. stack push/pop: popped=#{popped} remaining=#{stack.inspect}"
