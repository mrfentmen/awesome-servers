# Fibers and external enumerators: pausing and resuming work.

fiber = Fiber.new do |first|
  second = Fiber.yield(first * 2)
  third = Fiber.yield(second + 1)
  "done with #{third}"
end
puts "1. first resume: #{fiber.resume(10)}"
puts "2. second resume: #{fiber.resume(5)}"
puts "3. third resume: #{fiber.resume("last")}"
finished = begin
  fiber.resume
rescue FiberError => e
  "resuming a finished fiber raises #{e.class}"
end
puts "4. #{finished}"

counter = [1, 2].cycle
puts "5. cycle keeps going: #{counter.next}, #{counter.next}, #{counter.next}"

fib = Enumerator.new do |yielder|
  a = 0
  b = 1
  loop do
    yielder << a
    a, b = b, a + b
  end
end
puts "6. first 10 fibonacci: #{fib.first(10).inspect}"
puts "7. lazy take_while: #{fib.lazy.take_while { |n| n < 100 }.to_a.inspect}"

exhausted = begin
  [].each.next
rescue StopIteration
  "StopIteration raised"
end
puts "8. empty enumerator: #{exhausted}"
puts "9. Enumerator#with_index on a range: #{(1..3).each.with_index.map { |n, i| n * (i + 1) }.inspect}"
