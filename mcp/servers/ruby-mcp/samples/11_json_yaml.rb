# JSON and YAML: generate, parse, and the options that matter.

require "json"
require "yaml"

payload = { name: "ruby-mcp", version: "1.0.0", tags: %w[mcp ruby], meta: { stable: true } }
json = JSON.generate(payload)
puts "1. generate: #{json}"
puts "2. pretty_generate lines: #{JSON.pretty_generate({ a: 1 }).lines.length}"
puts "3. parse keeps string keys: #{JSON.parse(json)["meta"].inspect}"
puts "4. symbolize_names: #{JSON.parse(json, symbolize_names: true)[:tags].inspect}"
puts "5. to_json: #{ { a: 1 }.to_json}"

begin
  JSON.parse("{oops")
rescue JSON::ParserError => e
  puts "6. invalid json raises: #{e.class}"
end

yaml = YAML.dump({ "env" => "test", "ports" => [80, 443] })
puts "7. yaml dump starts with: #{yaml.lines.first.strip}"
loaded = YAML.safe_load(yaml)
puts "8. safe_load: #{loaded.inspect}"
puts "9. yaml round trip equal: #{loaded == { "env" => "test", "ports" => [80, 443] }}"
puts "10. dig into parsed json: #{JSON.parse('{"a":{"b":2}}').dig("a", "b")}"
