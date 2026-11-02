#!/usr/bin/env ruby
# frozen_string_literal: true

# Live introspection of the Ruby interpreter running this file.
#
# Protocol: this script is called as
#     ruby scripts/introspect.rb '<json request>'
# and always prints one JSON object to stdout:
#     {"ok": true,  "data": ...}
#     {"ok": false, "error": "message"}
#
# Everything it reports is read from the interpreter itself (Method#parameters,
# Module#ancestors, const_source_location, ...), so answers always match the Ruby
# that is actually installed on the machine.

require "json"
require "rbconfig"

begin
  require "rubygems"
rescue LoadError
  # Gem::Version based tools will report that rubygems is unavailable.
end

LIB_DIRS = [RbConfig::CONFIG["rubylibdir"], RbConfig::CONFIG["rubyarchdir"]].compact.reject(&:empty?).freeze
DOCS_BASE = "https://docs.ruby-lang.org/en/#{RUBY_VERSION.split(".")[0, 2].join(".")}/"

def respond(data)
  puts JSON.generate({ "ok" => true, "data" => data })
  exit 0
end

def respond_error(message)
  puts JSON.generate({ "ok" => false, "error" => message })
  exit 0
end

def doc_anchor(name)
  name.to_s.each_char.map { |c| c =~ /[A-Za-z0-9_]/ ? c : "-#{c.ord.to_s(16).upcase}" }.join
end

def docs_url(owner_name, kind, name)
  return nil if owner_name.nil? || owner_name.empty?

  page = owner_name.gsub("::", "/")
  prefix = kind == "singleton" ? "method-c" : "method-i"
  "#{DOCS_BASE}#{page}.html##{prefix}-#{doc_anchor(name)}"
end

# Features this process pulled in on demand, so answers can say where a class
# came from instead of silently loading the world.
REQUIRED_FEATURES = []

def snake_case(name)
  name.gsub(/([A-Z]+)([A-Z][a-z])/, '\\1_\\2')
      .gsub(/([a-z\d])([A-Z])/, '\\1_\\2')
      .downcase
end

# Net::HTTP only exists after `require "net/http"`, so try the conventional
# feature names for a namespace before giving up. Bounded to the requested path.
def try_require_namespace(path)
  parts = path.to_s.split("::").reject(&:empty?)
  return nil if parts.empty?

  candidates = []
  candidates << parts.map { |part| snake_case(part) }.join("/") if parts.length > 1
  candidates << snake_case(parts.first)
  candidates.uniq.each do |feature|
    next if feature.empty?
    begin
      require feature
    rescue LoadError, StandardError
      next
    end
    REQUIRED_FEATURES << feature
    return feature
  end
  nil
end

def resolve_parts(path)
  path.to_s.strip.split("::").reject(&:empty?).inject(Object) do |mod, part|
    if mod.is_a?(Module) && (mod.const_defined?(part, false) || mod.const_defined?(part))
      mod.const_get(part)
    else
      raise NameError, "#{part} is not defined under #{mod == Object ? "Object" : mod}"
    end
  end
end

def resolve_const(path)
  raise NameError, "empty constant name" if path.to_s.strip.empty?

  begin
    resolve_parts(path)
  rescue NameError => e
    loaded = try_require_namespace(path)
    raise e if loaded.nil?

    begin
      resolve_parts(path)
    rescue NameError
      raise NameError, "#{e.message} (after requiring \"#{loaded}\")"
    end
  end
end

def stdlib_module?(mod)
  return false unless mod.is_a?(Module)

  name = mod.name
  return false if name.nil? || name.empty?

  loc = begin
    Object.const_source_location(name)
  rescue StandardError
    nil
  end
  return true if loc.nil? # C core / C extension: no Ruby source file

  path = loc[0].to_s
  return false if path.include?("/gems/")

  LIB_DIRS.any? { |dir| path.start_with?(dir) }
end

def each_stdlib_module(include_gems: false)
  mods = ObjectSpace.each_object(Module).select do |m|
    next false if m.name.nil? || m.name.empty?
    next true if include_gems
    next false if m.name == "Gem" || m.name.start_with?("Gem::")

    stdlib_module?(m)
  end
  mods.sort_by!(&:name)
  mods
end

def own_method_names(mod, kind)
  target = kind == "singleton" ? mod.singleton_class : mod
  {
    "public" => target.public_instance_methods(false),
    "protected" => target.protected_instance_methods(false),
    "private" => target.private_instance_methods(false)
  }
end

# Visibility must be read from the inherited-inclusive lists, otherwise an
# inherited method is only known to exist, not how visible it is.
VISIBILITY_CACHE = {}

def visibility_lists(mod, kind)
  key = [mod.object_id, kind]
  cached = VISIBILITY_CACHE[key]
  return cached if cached

  lists = if kind == "singleton"
            [mod.public_methods, mod.protected_methods, mod.private_methods]
          else
            [mod.public_instance_methods, mod.protected_instance_methods, mod.private_instance_methods]
          end
  VISIBILITY_CACHE[key] = lists
  lists
end

def visibility_of(mod, kind, name)
  sym = name.to_sym
  public_list, protected_list, private_list = visibility_lists(mod, kind)
  return "public" if public_list.include?(sym)
  return "protected" if protected_list.include?(sym)
  return "private" if private_list.include?(sym)

  "undefined"
end

def unbound_method(mod, kind, name)
  if kind == "singleton"
    mod.singleton_class.instance_method(name)
  else
    mod.instance_method(name)
  end
rescue NameError
  nil
end

def render_params(params, cfunc, arity)
  # C methods expose no parameter names, only a required-argument count in #arity.
  return "(...)" if cfunc && arity != 0
  return "()" if params.empty?

  parts = params.map do |kind, name|
    case kind
    when :req then name.to_s
    when :opt then "#{name} = <optional>"
    when :rest then "*#{name || "args"}"
    when :keyreq then "#{name}:"
    when :key then "#{name}: <optional>"
    when :keyrest then "**#{name || "opts"}"
    when :block then "&#{name || "block"}"
    when :nokey then "**nil"
    else name.to_s
    end
  end
  "(#{parts.join(", ")})"
end

def method_record(mod, kind, name)
  um = unbound_method(mod, kind, name)
  return nil if um.nil?

  params = um.parameters
  arity = um.arity
  cfunc = um.source_location.nil?
  owner = um.owner
  owner_name = owner.name || mod.name
  {
    "name" => name.to_s,
    "signature" => "#{mod.name}#{kind == "singleton" ? "." : "#"}#{name}#{render_params(params, cfunc, arity)}",
    "owner" => owner_name,
    "kind" => kind,
    "visibility" => visibility_of(mod, kind, name),
    "parameters" => params.map { |(k, n)| { "kind" => k.to_s, "name" => n && n.to_s } },
    "arity" => arity,
    "parameters_rendered" => render_params(params, cfunc, arity),
    "implementation" => cfunc ? "C" : "Ruby",
    "source_location" => um.source_location,
    "docs_url" => docs_url(owner_name, kind, name)
  }
end

def op_version(_req)
  respond(
    "ruby_version" => RUBY_VERSION,
    "patchlevel" => RUBY_PATCHLEVEL,
    "description" => RUBY_DESCRIPTION,
    "engine" => defined?(RUBY_ENGINE) ? RUBY_ENGINE : "ruby",
    "engine_version" => defined?(RUBY_ENGINE_VERSION) ? RUBY_ENGINE_VERSION : RUBY_VERSION,
    "platform" => RUBY_PLATFORM,
    "default_encoding" => Encoding.default_external.name,
    "internal_encoding" => (Encoding.default_internal || Encoding.default_external).name,
    "rubylibdir" => RbConfig::CONFIG["rubylibdir"],
    "archdir" => RbConfig::CONFIG["rubyarchdir"],
    "bindir" => RbConfig::CONFIG["bindir"],
    "gem_dir" => defined?(Gem) ? Gem.dir : nil,
    "load_path_entries" => $LOAD_PATH.length,
    "rubygems" => defined?(Gem) ? Gem::VERSION : nil,
    "stdlib_modules_visible" => each_stdlib_module.length
  )
end

def op_search_classes(req)
  query = req["query"].to_s.downcase
  limit = (req["limit"] || 20).to_i.clamp(1, 200)
  include_gems = req["include_gems"] == true
  matches = each_stdlib_module(include_gems: include_gems).select { |m| m.name.downcase.include?(query) }
  # Namespaced stdlib (Net::HTTP, JSON::Ext, ...) only exists after its require.
  if matches.empty? && query.include?("::")
    try_require_namespace(query.split("::").first)
    matches = each_stdlib_module(include_gems: include_gems).select { |m| m.name.downcase.include?(query) }
  end
  exact = matches.select { |m| m.name.downcase == query }
  rest = matches - exact
  picked = (exact + rest).first(limit)
  respond(
    "query" => query,
    "loaded_features" => REQUIRED_FEATURES.uniq,
    "total_matches" => matches.length,
    "classes" => picked.map do |m|
      {
        "name" => m.name,
        "kind" => m.is_a?(Class) ? "class" : "module",
        "superclass" => (m.is_a?(Class) ? (m.superclass && m.superclass.name) : nil),
        "instance_methods" => m.instance_methods(false).length + m.private_instance_methods(false).length,
        "docs_url" => "#{DOCS_BASE}#{m.name.gsub("::", "/")}.html"
      }
    end
  )
end

def op_class_info(req)
  name = req["name"].to_s
  mod = begin
    resolve_const(name)
  rescue NameError => e
    respond_error("No constant #{name}: #{e.message}")
  end
  respond_error("#{name} is a #{mod.class}, not a class or module") unless mod.is_a?(Module)

  own_inst = own_method_names(mod, "instance")
  own_single = own_method_names(mod, "singleton")
  ancestors = mod.ancestors
  chain = []
  if mod.is_a?(Class)
    k = mod
    while k
      chain << k.name
      k = k.superclass
    end
  end
  loc = begin
    Object.const_source_location(mod.name)
  rescue StandardError
    nil
  end
  respond(
    "name" => mod.name,
    "kind" => mod.is_a?(Class) ? "class" : "module",
    "superclass" => (mod.is_a?(Class) && mod.superclass ? mod.superclass.name : nil),
    "superclass_chain" => chain,
    "ancestors" => ancestors.map(&:name),
    "included_modules" => mod.included_modules.map(&:name),
    "instance_method_counts" => own_inst.transform_values(&:length),
    "singleton_method_counts" => own_single.transform_values(&:length),
    "instance_methods_total" => mod.instance_methods.length + mod.private_instance_methods.length,
    "constants" => mod.constants(false).map(&:to_s).sort,
    "stdlib" => stdlib_module?(mod),
    "implementation" => loc ? "Ruby (#{loc[0]}:#{loc[1]})" : "C",
    "loaded_features" => REQUIRED_FEATURES.uniq,
    "docs_url" => "#{DOCS_BASE}#{mod.name.gsub("::", "/")}.html"
  )
end

def op_list_methods(req)
  name = req["name"].to_s
  mod = begin
    resolve_const(name)
  rescue NameError => e
    respond_error("No constant #{name}: #{e.message}")
  end
  respond_error("#{name} is not a class or module") unless mod.is_a?(Module)

  kind = req["kind"].to_s.empty? ? "instance" : req["kind"].to_s
  respond_error("kind must be instance or singleton") unless %w[instance singleton].include?(kind)
  visibility = req["visibility"].to_s.empty? ? "all" : req["visibility"].to_s
  include_inherited = req["include_inherited"] == true
  limit = (req["limit"] || 500).to_i.clamp(1, 2000)

  target = kind == "singleton" ? mod.singleton_class : mod
  groups = if include_inherited
             {
               "public" => target.public_instance_methods.sort,
               "protected" => target.protected_instance_methods.sort,
               "private" => target.private_instance_methods.sort
             }
           else
             own_method_names(mod, kind).transform_values(&:sort)
           end
  groups = groups.select { |vis, _| visibility == "all" || vis == visibility }
  total = groups.values.map(&:length).sum

  rendered = {}
  groups.each do |vis, names|
    rendered[vis] = names.first(limit).map { |n| method_record(mod, kind, n) }.compact
  end
  respond(
    "name" => mod.name,
    "kind" => kind,
    "include_inherited" => include_inherited,
    "total" => total,
    "shown" => rendered.values.map(&:length).sum,
    "limit_per_group" => limit,
    "groups" => rendered
  )
end

def op_method_info(req)
  class_name = req["class"].to_s
  method_name = req["method"].to_s
  respond_error("method name is required") if method_name.empty?
  mod = begin
    resolve_const(class_name)
  rescue NameError => e
    respond_error("No constant #{class_name}: #{e.message}")
  end
  respond_error("#{class_name} is not a class or module") unless mod.is_a?(Module)

  requested_kind = req["kind"].to_s.empty? ? "auto" : req["kind"].to_s
  respond_error("kind must be instance, singleton or auto") unless %w[instance singleton auto].include?(requested_kind)

  instance_available = mod.method_defined?(method_name) ||
                       mod.private_method_defined?(method_name) ||
                       mod.protected_method_defined?(method_name)
  singleton_available = mod.singleton_class.method_defined?(method_name) ||
                        mod.singleton_class.private_method_defined?(method_name) ||
                        mod.singleton_class.protected_method_defined?(method_name)

  found = if requested_kind == "instance"
            instance_available ? method_record(mod, "instance", method_name) : nil
          elsif requested_kind == "singleton"
            singleton_available ? method_record(mod, "singleton", method_name) : nil
          else
            (instance_available ? method_record(mod, "instance", method_name) : nil) ||
              (singleton_available ? method_record(mod, "singleton", method_name) : nil)
          end

  if found.nil?
    respond_error("#{class_name} has no #{requested_kind == "auto" ? "" : "#{requested_kind} "}method named #{method_name}")
  end

  found["requested_class"] = mod.name
  found["method_defined_in_requested_class"] = found["owner"] == mod.name
  respond(found)
end

def op_search_methods(req)
  query = req["query"].to_s.downcase
  limit = (req["limit"] || 15).to_i.clamp(1, 200)
  include_gems = req["include_gems"] == true
  only_class = req["class"].to_s

  mods = if only_class.empty?
           each_stdlib_module(include_gems: include_gems)
         else
           [begin
             resolve_const(only_class)
           rescue NameError => e
             respond_error("No constant #{only_class}: #{e.message}")
           end]
         end
  respond_error("#{only_class} is not a class or module") if mods.any? { |m| !m.is_a?(Module) }

  matches = []
  mods.each do |mod|
    %w[instance singleton].each do |kind|
      names = own_method_names(mod, kind).values.flatten.uniq
      hit = names.select { |n| n.to_s.downcase.include?(query) }
      hit.sort_by { |n| [n.to_s == query ? 0 : (n.to_s.downcase.start_with?(query) ? 1 : 2), n.to_s] }.each do |n|
        break if matches.length >= limit
        record = method_record(mod, kind, n)
        matches << record if record
      end
    end
    break if matches.length >= limit
  end

  respond(
    "query" => query,
    "class" => only_class.empty? ? nil : only_class,
    "searched_classes" => mods.length,
    "matches" => matches
  )
end

def op_constant(req)
  path = req["path"].to_s
  value = begin
    resolve_const(path)
  rescue NameError => e
    respond_error("No constant #{path}: #{e.message}")
  end
  loc = begin
    Object.const_source_location(path)
  rescue StandardError
    nil
  end
  shown = begin
    value.inspect
  rescue StandardError => e
    "#<#{value.class} inspect failed: #{e.class}>"
  end
  respond(
    "path" => path,
    "type" => value.is_a?(Module) ? (value.is_a?(Class) ? "class" : "module") : value.class.name,
    "inspect" => shown.length > 600 ? "#{shown[0, 600]}... (truncated)" : shown,
    "frozen" => (value.frozen? rescue nil),
    "source_location" => loc,
    "docs_url" => (value.is_a?(Module) ? "#{DOCS_BASE}#{value.name.to_s.gsub("::", "/")}.html" : nil)
  )
end

def op_compare_versions(req)
  unless defined?(Gem::Version)
    respond_error("rubygems is not available in this Ruby, so Gem::Version cannot be used")
  end
  left = Gem::Version.correct?(req["a"].to_s)
  right = Gem::Version.correct?(req["b"].to_s)
  respond_error("\"#{req["a"]}\" is not a valid Gem::Version") unless left
  respond_error("\"#{req["b"]}\" is not a valid Gem::Version") unless right

  a = Gem::Version.new(req["a"].to_s)
  b = Gem::Version.new(req["b"].to_s)
  respond(
    "a" => { "input" => req["a"].to_s, "normalized" => a.to_s, "segments" => a.segments },
    "b" => { "input" => req["b"].to_s, "normalized" => b.to_s, "segments" => b.segments },
    "comparison" => a <=> b,
    "relation" => (a <=> b).zero? ? "equal" : ((a <=> b).positive? ? "a is newer" : "b is newer"),
    "prerelease" => { "a" => a.prerelease?, "b" => b.prerelease? }
  )
end

OPS = {
  "version" => method(:op_version),
  "search_classes" => method(:op_search_classes),
  "class_info" => method(:op_class_info),
  "list_methods" => method(:op_list_methods),
  "method_info" => method(:op_method_info),
  "search_methods" => method(:op_search_methods),
  "constant" => method(:op_constant),
  "compare_versions" => method(:op_compare_versions)
}.freeze

begin
  raw = ARGV[0]
  respond_error("no request supplied") if raw.nil? || raw.strip.empty?
  request = JSON.parse(raw)
  op = request["op"].to_s
  handler = OPS[op]
  respond_error("unknown op \"#{op}\". Known ops: #{OPS.keys.join(", ")}") if handler.nil?
  handler.call(request)
rescue JSON::ParserError => e
  respond_error("request was not valid JSON: #{e.message}")
rescue StandardError, ScriptError => e
  respond_error("#{e.class}: #{e.message}")
end
