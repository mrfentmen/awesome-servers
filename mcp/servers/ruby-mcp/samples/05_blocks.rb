# Blocks, procs and lambdas: what each one does differently.

def with_yield
  return "no block given" unless block_given?

  "block returned #{yield(2)}"
end
puts "1. yield: #{with_yield { |n| n * 21 }}"
puts "2. no block: #{with_yield}"

adder = proc { |a, b| a + b }
puts "3. proc call: #{adder.call(1, 2)}, proc arity is lenient: #{adder.call(1, 2, 3)}"

strict = lambda { |a, b| a + b }
puts "4. lambda call: #{strict.call(1, 2)}, lambda arity: #{strict.arity}"

def method_arity_of(callable)
  callable.arity
end
puts "5. proc arity: #{method_arity_of(proc { |a, b| })}, lambda arity: #{method_arity_of(lambda { |a, b| })}"

def takes_block(&block)
  block.call("explicitly")
end
puts "6. explicit &block parameter: #{takes_block { |s| "called #{s}" }}"

def relay(&block)
  [1, 2, 3].map(&block)
end
puts "7. passing a block straight through with &: #{relay { |n| n**2 }.inspect}"

doubler = :to_s.to_proc
puts "8. symbol to proc: #{[1, 2].map(&doubler).inspect}"

enum = [10, 20, 30].each
puts "9. external enumerator: #{enum.next} then #{enum.next}"

lazy = (1..Float::INFINITY).lazy.map { |n| n * 3 }.select(&:even?).first(3)
puts "10. lazy over an infinite range: #{lazy.inspect}"

tally_like = [1, 2, 2, 3].each_with_object(Hash.new(0)) { |n, h| h[n] += 1 }
puts "11. counting with each_with_object: #{tally_like.inspect}"
