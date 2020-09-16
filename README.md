# fun-lang
The fun programming language is a concatenative, functional programming language.

It is also stack-based and uses pattern matching with the top of the stack to allow to name symbols so its manipulation is made easier in code.

As an introductory example:

```
true then else branch = then . ;
false then else branch = else . ;

[]      _  map = [] ;
[x::xs] fn map = x fn . xs fn map :: ;

[]      _  filter = [] ;
[x::xs] fn filter = x fn . [x xs fn filter ::] [xs fn filter] branch ;

[]      v _  reduce = v ;
[x::xs] v fn reduce = xs v x fn . fn reduce ;

makeBigger  = 10 * ;
bigEnough   = 50 > ;
smallEnough = 100 <= ;

numbers = [ 3 4 6 10 4 11 ] ;

main = numbers [makeBigger] map [bigEnough] filter [smallEnough] filter 0 [+] reduce ;
```

This program applies map, filter and reduce sequentially to a list of numbers.

Also introduces __branch__ which is a function that basically performs bifurcation (if-then-else way).

__Fun__ is influenced by __joy__ so the lists are also quotations and can be invoked with the apply operator (the dot .)

The basic types of __fun__ are numbers, strings and booleans.
The composite types are lists and objects (javascript style, but only data)

Another example:
```
[]      _  map = [] ;
[x::xs] fn map = x fn . xs fn map :: ;

{}      _  map = {} ;
{v l r} fn map = "v" v fn . "l" l fn map "r" r fn map {} : : : ;

main = {v:1 l:{v:3 l:{} r:{}} r:{}} [1 +] map [1 2] [1 +] map ;
```

Here we have two `map` functions, one for lists and the other for objects that shape a binary tree.
Or it is a single function, as you prefer.

There you can see that `::` is the `cons` primitive for lists while `:` is the attribute-append operator.

There can be a number of patterns for the stack to match previous to a function definition, or none:

```
x squareWithPattern = x x * ;
squareWithoutPattern = dup * ;
```

Interestingly enough, `dup` is not a primitive as in other concatenative languages, so you need to define yourself:
```
x dup = x x ;
x y swap = y x ;
x y drop = x ;
// etc...
```

The list of patterns you can use are as follows:
```
1 matchExactConstant = ... ;
a matchAny = ... ;
[] matchEmptyList = ... ;
[a 2 "hello"] matchAList = ... ; //will match [true 2 "hello"], [[2 3 {}] 2 "hello"], etc...
[a 2 "hello" :: rest] matchOtherList = ... ; //will match [true 2 "hello"], [[2 3 {}] 2 "hello"], [1 2 "hello" 2 3 4] where rest = [2 3 4], etc...
{} matchEmptyObject = ... ;
{a} matchObjectsWithAKeyNamed_a = ... ; // will match {a:2 b:3}, {a:[2 3]}, etc...
{a:1 b:_ _:true _:_} matchObject = ... ; // will match object with a key "a" with value 1, which has a key "b", also any key with a true value, and at least 4 members
```

More examples:
```
// Bifurcations aka if-then-else
true then else branch = then . ;
false then else branch = else . ;
cond then else ifte = cond . then else branch;

// Check if a list is empty or not
[]      isEmpty = true ;
[x::xs] isEmpty = false ;

// Typical head + tail functional functions for lists
[x::xs] head = x ;
[x::xs] tail = xs ;

// Map defined in one line
l f map = [l isEmpty] [[]] [l head f . l tail f map ::] ifte ;

```

Also, there is no need to name the functions with letters, you can use symbols that have no previous meaning:
```
//Recursive factorial
0 fact1 = 1 ;
n fact1 = n n 1 - fact1 * ;

//Tail optimized recursive factorial
0 v fact2 = v ;
n v fact2 = n 1 - n v * fact2 ;

//Tail optimized wrapper
n !! = n 1 fact2 ;

main = 5 fact1 5 1 fact2 5 !! ;
```

## TODO
A lot of things, this is a minimal proof of concept.
The next iteration will allow to:
 - Name composite parameters, something as `list@[x::xs]`, in patterns.
 - Name 'the rest of the object' as in lists, something as `{x y ::rest}`
 - Move from JS to C and explore ref-counted memory management (if something is not referenced from the stack, goodbye)
 - Explore the possibility to generate native binaries
 - Add I/O, FFI....
 - Explicit types? ... types can only be checked at runtime though...
 