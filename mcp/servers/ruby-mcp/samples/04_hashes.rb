# Hash methods: defaults, digging, merging, grouping.

config = { host: "localhost", port: 8080, tls: false }
puts "1. keys: #{config.keys.inspect}"
puts "2. fetch with fallback: #{config.fetch(:user, "anonymous").inspect}"
puts "3. fetch raises for missing keys: #{begin; config.fetch(:user); rescue KeyError => e; e.class; end}"

nested = { db: { primary: { host: "db1" } } }
puts "4. dig: #{nested.dig(:db, :primary, :host).inspect}, missing: #{nested.dig(:db, :replica, :host).inspect}"

overrides = { port: 9090, debug: true }
puts "5. merge: #{config.merge(overrides).inspect}"
puts "6. merge block wins for conflicts: #{config.merge(overrides) { |_k, old, new| "old=#{old} new=#{new}" }[:port].inspect}"

puts "7. transform_values: #{config.transform_values { |v| v.class.name }.inspect}"
puts "8. select by value: #{config.select { |_k, v| v.is_a?(Integer) }.inspect}"

words = %w[apple avocado banana blueberry cherry]
by_first_letter = words.group_by { |w| w[0] }
puts "9. group_by first letter: #{by_first_letter.transform_values(&:size).inspect}"

counts = words.each_with_object(Hash.new(0)) do |word, acc|
  acc[word.length] += 1
end
puts "10. length histogram: #{counts.sort.inspect}"

puts "11. invert: #{ { a: 1, b: 2 }.invert.inspect}"
puts "12. min_by / max_by on pairs: #{words.min_by(2) { |w| w.length }.inspect}"

with_default = Hash.new { |hash, key| hash[key] = "no #{key}" }
puts "13. default proc: #{with_default[:x].inspect}"
puts "14. to_a then to_h round trip: #{config.to_a.to_h == config}"
