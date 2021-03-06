# fun-lang
The fun programming language is a concatenative, functional programming language.

It is also stack-based and uses pattern matching with the top of the stack to allow to name symbols so its manipulation is made easier in code.

As an introductory example:

```
true  then else branch = then . ;
false then else branch = else . ;

[]      _  map = [] ;
[x]::xs fn map = x fn . xs fn map :: ;

[]      _  filter = [] ;
[x]::xs fn filter = x fn . [x xs fn filter ::] [xs fn filter] branch ;

[]      v _  reduce = v ;
[x]::xs v fn reduce = xs v x fn . fn reduce ;

makeBigger  = 10 * ;
bigEnough   = 50 > ;
smallEnough = 100 <= ;

numbers = [ 3 4 6 10 4 11 ] ;

main = numbers [makeBigger] map [bigEnough] filter [smallEnough] filter 0 [+] reduce ;
```

This program applies `map`, `filter` and `reduce` sequentially to a list of numbers.

Also introduces `branch` which is a function that basically performs bifurcation (if-then-else way).

__Fun__ is influenced by __joy__ so the lists are also quotations and can be invoked with the apply operator (the dot `.`)

The basic types of __fun__ are numbers, strings and booleans.
The composite types are lists and objects (javascript style, but only data)

Another example:
```
[]      _  map = [] ;
[x]::xs fn map = x fn . xs fn map :: ;

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
x   dup  = x x ;
x y swap = y x ;
x y drop = x ;
// etc...
```

The list of patterns you can use are as follows:
```
1 matchExactConstant = ... ;

a matchAny = ... ;

[] matchEmptyList = ... ;

// Will match [true 2 "hello"], [[2 3 {}] 2 "hello"], etc...
[a 2 "hello"] matchAList = ... ; 

// Will match [true 2 "hello"], [[2 3 {}] 2 "hello"], [1 2 "hello" 2 3 4] where rest = [2 3 4], etc...
[a 2 "hello"] :: rest matchOtherList = ... ; 

{} matchEmptyObject = ... ;

 // Will match {a:2 b:3}, {a:[2 3]}, etc...
{a} matchObjectsWithAKeyNamed_a = ... ;

// Will match object with a key "a" with value 1, which has a key "b", also any key with a true value, and at least 4 members
{a:1 b:_ _:true _:_} matchObject = ... ; 
```

More examples:
```
// Bifurcations aka if-then-else
true then else branch = then . ;
false then else branch = else . ;
cond then else ifte = cond . then else branch;

// Check if a list is empty or not
[]      isEmpty = true ;
[x]::xs isEmpty = false ;

// Typical head + tail functional functions for lists
[x]::xs head = x ;
[x]::xs tail = xs ;

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

You can name composite patterns to reference the full object when dissection is also needed to access a field:
```
// Bifurcations aka if-then-else
true  then else branch = then . ;
false then else branch = else . ;
cond  then else ifte   = cond . then else branch;

today = ... ;
performOtherDuties = ... ;

person@{name email birth}::rest sendEmailOnBirthday = 
        [today birth ==] 
            [ "Congrats on your bithday " name "!" + + "Congrats!" email send ] 
            [ person performOtherDuties ] 
        ifte ;

main = {name:"John" surname:"Doe" email:"john@doe.com" birth:{day:16 month:5 year:1978} address:... }  sendEmailOnBirthday;
```

If you need to show something, there is an (possibly temporary) internal function to do so:
```
0 fact = 1 ;
n fact = n n 1 - fact1 * ;

main = 5 fact show;
```

Also, `apply` and `quote` can be defined as `dup` and the rest so technically the `apply` operator is not needed:
```
a empty = a ;

a   dup  = a a ;
a b swap = b a ;
a b drop = a   ; // alternatively "a drop = empty"

[]      apply = empty ; // Given we can't write '[] apply = ;' to mean the function does nothing, check 'empty' function
[x]::xs apply = x xs apply ;

  xs 0 quoteImpl = xs ;
x xs n quoteImpl = x xs :: n 1 - quoteImpl ;
     n quote     = [] n quoteImpl ;

[]      ys compose = ys ;
[x]::xs ys compose = x xs ys compose :: ;

/*
//Single element implementations could be:
[a]     apply   = a ;
a       quote   = [a] ;
[a] [b] compose = [a b]
*/


main = [1 2 3 4] apply 4 quote [5 6 7 8] compose;
```

## TODO
A lot of things, this is a minimal proof of concept.
The next iteration will allow to:
 - Explore function literals, something like `(a b => b a)` (this would be  `swap`). Thinking about when more than one pattern is needed... something like: `(0 => 1 | n => n n 1 - rec)` where `rec` means self-reference... not sure, have to think about it.
 - Explore ADTs... something like `type Maybe = Nothing | Just(x)` or `type BinTree = Empty | Node(info BinTree BinTree)` and then use in patterns as:
 ```
type BinTree = Empty | x BinTree BinTree Node ; //Node(x BinTree BinTree) ?

Empty            element insert = element Empty Empty Node ;
n@Node(info l r) element insert = 
        [element info <] 
            [info l element insert r Node]
            [
                [element info >]
                    [info l r element insert Node]
                    [n]
                ifte
            ] 
        ifte ;

type List = Empty | x List Cons ; // Or Cons(x List) ?

//Integrated Lists...
// []      isEmpty = true ;
// [x]::xs isEmpty = false ;
//
// [x]::xs head = x ;
// [x]::xs tail = xs ;
//
// []      _  map = [] ;
// [x]::xs fn map = x fn . xs fn map :: ;
//
//versus ADT lists:

Empty        isEmpty = true ;
Cons(x List) isEmpty = false ;

Cons(x List)    head = x ;
Cons(x xs@List) tail = xs ;

Empty           _  map = Empty ;
Cons(x xs@List) fn map = x fn . xs fn map Cons ;


main = 2 1 Empty Empty Node Empty Node 3 insert;
```
but note the two-folded role for the ADTs tags, as constructor functions and as tag matcher...
On the other hand maybe ADTs are all is needed and dont need special syntax for lists and objects.
Also, they introduce the notion of type as and structural thing... But in order to be minimalistic, maybe is good there are only basic types and every composite type is an ADT...

 - Move from JS to C and explore ref-counted memory management (if something is not referenced from the stack, goodbye)
 - Explore the possibility to generate native binaries
 - Add I/O, FFI....
 - Explicit types? ... types can only be checked at runtime though...
 
